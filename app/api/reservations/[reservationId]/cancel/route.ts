import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

import { adminFirestore } from '@/lib/firebase/admin';
import { ADMIN_ROLES, authErrorResponse, requireRole } from '@/lib/auth/server';
import { recordAudit } from '@/lib/auth/audit';
import { CLAIM_STALE_AFTER_MS, dollarsToCents } from '@/lib/auth/policy';
import {
  executeCancellationRefund,
  type RefundRecord,
  type StripePort,
} from '@/lib/payments/refund-flow';

export const dynamic = 'force-dynamic';

// The single shared Stripe client (lib/stripe.ts) supplies the API version.
// This resolves finding R-04: the webhook was pinned to 2024-04-10 while the
// reservation routes declared 2024-06-20, so they read different API shapes.
/**
 * POST /api/reservations/[reservationId]/cancel — cancel and optionally refund.
 *
 * Previously unauthenticated, with the refund amount and the operator's name
 * both taken from the request body.
 *
 * THREE INDEPENDENT PROTECTIONS AGAINST A DOUBLE REFUND — no single one is
 * relied upon:
 *
 *   1. A Firestore transaction CLAIMS the cancellation before any money moves,
 *      so two simultaneous operators cannot both proceed.
 *   2. Before creating a refund, Stripe is asked whether one already exists for
 *      this reservation. Stripe's records are permanent, so this survives both
 *      the 24-hour idempotency window and an expired claim.
 *   3. A Stripe idempotency key derived from the reservation id, covering a
 *      client retry after a network timeout.
 *
 * Steps 2 and 3 live in `lib/payments/refund-flow.ts`, which the scenario tests
 * drive directly through a fake Stripe.
 */
/**
 * Web refunds are OFF unless explicitly enabled.
 *
 * Set WEB_REFUNDS_ENABLED=true only after the refund flow has been verified
 * against Stripe test mode. Any other value, including unset, keeps the route
 * refusing to move money.
 */
export function webRefundsEnabled(): boolean {
  return process.env.WEB_REFUNDS_ENABLED === 'true';
}

// POST /api/reservations/[reservationId]/cancel - Cancel reservation and process refund
export async function POST(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  const { reservationId } = params;
  const reservationRef = adminFirestore.collection('reservations').doc(reservationId);
  let claimed = false;

  try {
    const actor = await requireRole(request, ADMIN_ROLES, { checkRevoked: true });

    // ---- 0. Refund kill switch ------------------------------------------
    //
    // The rewritten refund flow below has been verified only against a mock
    // Stripe adapter. Until it has been exercised against Stripe TEST MODE —
    // a real signed webhook and a real test-mode refund — this route must not
    // move money.
    //
    // WEB_REFUNDS_ENABLED is deliberately opt-IN, so the security fix (the
    // `requireRole` guard above, which closes an endpoint that any anonymous
    // caller could previously use to issue refunds) can ship on its own
    // without shipping unverified money-moving logic with it.
    //
    // The check sits AFTER authentication so an anonymous caller still gets
    // 401 and learns nothing about the flag, and BEFORE the database claim so
    // no reservation is marked cancelled while refunds are unavailable —
    // a cancelled-but-unrefunded booking would be worse than a refusal.
    //
    // While disabled, refunds are issued from the Stripe Dashboard by hand.
    if (!webRefundsEnabled()) {
      console.warn('[cancel] refused — web refunds are disabled pending test-mode verification', {
        reservationId,
        actor: actor.uid,
      });
      return NextResponse.json(
        {
          error: 'Refunds through the website are temporarily unavailable.',
          detail:
            'Cancellations and refunds are being issued from the Stripe Dashboard while the ' +
            'refund flow completes test-mode verification. No charge has been made or reversed ' +
            'by this request.',
          code: 'WEB_REFUNDS_DISABLED',
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 500) : '';
    const wantsRefund = typeof body?.refundAmount === 'number' && body.refundAmount > 0;

    let requestedCents = 0;
    if (wantsRefund) {
      const converted = dollarsToCents(body.refundAmount);
      if (converted === null) {
        return NextResponse.json(
          { error: 'refundAmount must be a positive amount with at most 2 decimal places' },
          { status: 400 }
        );
      }
      requestedCents = converted;
    }

    // ---- 1. Claim the cancellation atomically, BEFORE any money moves ----
    const claim = await adminFirestore.runTransaction(async (tx) => {
      const snap = await tx.get(reservationRef);
      if (!snap.exists) return { ok: false as const, status: 404, error: 'Reservation not found' };

      const data = snap.data()!;
      if (data.status === 'cancelled') {
        return { ok: false as const, status: 409, error: 'Reservation already cancelled' };
      }

      // A previous attempt that died mid-flight leaves a claim behind. Allow a
      // retry once it is demonstrably stale, so one crash cannot lock a booking
      // out of cancellation forever. Protection 2 still prevents a duplicate
      // refund in that window.
      const inProgressAt = data.cancellationClaimedAt ? Date.parse(data.cancellationClaimedAt) : 0;
      if (inProgressAt && Date.now() - inProgressAt < CLAIM_STALE_AFTER_MS) {
        return { ok: false as const, status: 409, error: 'A cancellation is already in progress' };
      }

      if (!data.paymentId) {
        return { ok: false as const, status: 400, error: 'No payment associated with this reservation' };
      }

      tx.update(reservationRef, {
        cancellationClaimedAt: new Date().toISOString(),
        cancellationClaimedByUid: actor.uid,
      });
      return {
        ok: true as const,
        paymentId: data.paymentId as string,
        eventId: data.eventId as string | undefined,
        tableId: data.tableId as string | undefined,
      };
    });

    if (!claim.ok) {
      return NextResponse.json({ error: claim.error }, { status: claim.status });
    }
    claimed = true;

    let refundId: string | null = null;
    let refundStatus = 'not_processed';
    let refundedCents = 0;
    let reusedExisting = false;
    let amountDifferedFromRequest = false;

    if (wantsRefund) {
      // ---- 2/3. Shared, exhaustively-simulated refund flow ----
      const outcome = await executeCancellationRefund({
        stripe: stripeAdapter(stripe),
        paymentIntentId: claim.paymentId,
        reservationId,
        requestedCents,
        actorUid: actor.uid,
      });

      if (outcome.kind === 'refused') {
        await releaseClaim(reservationRef);
        return NextResponse.json(
          { error: outcome.reason, refundableCents: outcome.refundableCents },
          { status: outcome.status }
        );
      }

      if (outcome.kind !== 'none') {
        refundId = outcome.refund.id;
        refundStatus = outcome.refund.status ?? 'unknown';
        refundedCents = outcome.refund.amount;
        if (outcome.kind === 'reused') {
          reusedExisting = true;
          amountDifferedFromRequest = outcome.requestedDiffers;
          console.warn('[cancel] reused an existing refund', {
            reservationId,
            refundId,
            requestedDiffers: outcome.requestedDiffers,
          });
        }
      }
    }

    // ---- 4. Finalise ----
    await reservationRef.update({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledByUid: actor.uid,
      cancellationReason: reason,
      refundId,
      refundAmountCents: refundedCents,
      // Retained in dollars alongside the canonical cents value so existing
      // admin views and historical records keep the same shape.
      refundAmount: refundedCents / 100,
      refundStatus,
      cancellationClaimedAt: null,
      cancellationClaimedByUid: null,
      updatedAt: new Date().toISOString(),
    });
    claimed = false;

    // Bookkeeping mirror. Best-effort and deliberately AFTER finalisation: the
    // refund is already durable in Stripe, and failing here must not invite a
    // retry that an operator would read as "the refund did not happen".
    if (refundId) {
      try {
        await adminFirestore.collection('refunds').doc(refundId).set({
          id: refundId,
          paymentIntentId: claim.paymentId,
          reservationId,
          amountCents: refundedCents,
          status: refundStatus,
          reason,
          processedByUid: actor.uid,
          reusedExisting,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch {
        console.error('[cancel] refund recorded in Stripe but not mirrored locally', { reservationId, refundId });
      }
    }

    // Best-effort table release; set(merge) cannot throw on a deleted table.
    if (claim.eventId && claim.tableId) {
      try {
        await adminFirestore
          .collection('events').doc(claim.eventId)
          .collection('tables').doc(claim.tableId)
          .set({ reserved: false, reservedBy: null, reservationId: null, updatedAt: new Date().toISOString() }, { merge: true });
      } catch {
        console.error('[cancel] table release failed', { reservationId });
      }
    }

    await recordAudit({
      action: refundId ? 'reservation.refund' : 'reservation.cancel',
      actorUid: actor.uid,
      actorRole: actor.role,
      targetType: 'reservation',
      targetId: reservationId,
      details: {
        refundId,
        refundAmountCents: refundedCents,
        refundStatus,
        reusedExisting,
        hadReason: reason.length > 0,
      },
    });

    return NextResponse.json({
      message: 'Reservation cancelled',
      cancelledAt: new Date().toISOString(),
      refund: refundId
        ? {
            id: refundId,
            amountCents: refundedCents,
            amount: refundedCents / 100,
            status: refundStatus,
            reusedExisting,
            // Told plainly, so an operator never assumes the amount they typed
            // is the amount that actually moved.
            ...(amountDifferedFromRequest
              ? { notice: 'An earlier refund already existed for this reservation; its amount was used.' }
              : {}),
          }
        : null,
    });
  } catch (error) {
    if (claimed) await releaseClaim(reservationRef);
    const authed = authErrorResponse(error);
    if (authed) return authed;
    console.error('[cancel] failed', { reservationId });
    return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 });
  }
}

/** Releases a cancellation claim so a failed attempt can be retried. */
async function releaseClaim(ref: FirebaseFirestore.DocumentReference): Promise<void> {
  try {
    await ref.update({ cancellationClaimedAt: null, cancellationClaimedByUid: null });
  } catch {
    // The claim expires on its own after CLAIM_STALE_AFTER_MS.
  }
}

/**
 * Real Stripe adapter.
 *
 * `listRefunds` auto-paginates: a single `list` call caps at 100, and missing a
 * page would mean failing to see an existing refund and creating a duplicate.
 */
function stripeAdapter(client: Stripe): StripePort {
  return {
    async getChargeTotals(paymentIntentId) {
      const intent = await client.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
      const charge = intent.latest_charge as Stripe.Charge | null;
      if (!charge || typeof charge === 'string' || !charge.captured) {
        throw new Error('NO_SETTLED_CHARGE');
      }
      return {
        amountCaptured: charge.amount_captured,
        amountRefunded: charge.amount_refunded,
        currency: charge.currency,
      };
    },
    async listRefunds(paymentIntentId) {
      const all = await client.refunds
        .list({ payment_intent: paymentIntentId, limit: 100 })
        .autoPagingToArray({ limit: 1000 });
      return all.map<RefundRecord>((r: Stripe.Refund) => ({
        id: r.id,
        amount: r.amount,
        status: r.status as RefundRecord['status'],
        metadata: r.metadata ?? null,
      }));
    },
    async createRefund({ paymentIntentId, amountCents, idempotencyKey, metadata }) {
      const r = await client.refunds.create(
        { payment_intent: paymentIntentId, amount: amountCents, reason: 'requested_by_customer', metadata },
        { idempotencyKey }
      );
      return { id: r.id, amount: r.amount, status: r.status as RefundRecord['status'], metadata: r.metadata ?? null };
    },
  };
}
