import { NextRequest, NextResponse } from 'next/server';

import { adminAuth, adminFirestore } from '@/lib/firebase/admin';
import { ADMIN_ROLES, authErrorResponse, requireSelfOrRole, requireUser, type Role } from '@/lib/auth/server';
import { recordAudit } from '@/lib/auth/audit';

export const dynamic = 'force-dynamic';

const ASSIGNABLE_ROLES: Role[] = ['user', 'promoter', 'staff', 'admin'];

/**
 * Kill switch for role changes over the API. Default OFF.
 *
 * No part of the admin interface changes roles — there is no ManageUsers
 * component, and the only caller of this endpoint is a customer editing their
 * own profile. Blocking the capability outright therefore costs nothing and
 * removes the highest-consequence operation in the app while the exposure is
 * being investigated. Roles are changed from the Firebase console meanwhile.
 *
 * Set ALLOW_ROLE_CHANGES_VIA_API=true to re-enable once the forensics review
 * and claims migration are complete.
 */
const ROLE_CHANGES_ENABLED = process.env.ALLOW_ROLE_CHANGES_VIA_API === 'true';

/** Fields a user may change about themselves. `role` is deliberately absent. */
const SELF_EDITABLE = ['displayName', 'phoneNumber', 'firstName', 'lastName', 'photoURL'] as const;

function isNonEmptyString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

// GET /api/users/[userId] - Get user by ID. Self or admin only.
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await requireSelfOrRole(request, params.userId, ADMIN_ROLES);

    const userDoc = await adminFirestore.collection('users').doc(params.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(userDoc.data());
  } catch (error) {
    const authed = authErrorResponse(error);
    if (authed) return authed;
    console.error('Error fetching user'); // no id in logs
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

/**
 * PATCH /api/users/[userId]
 *
 * Two distinct capabilities, deliberately separated:
 *   - a user editing their own profile  -> SELF_EDITABLE only
 *   - an admin changing a role          -> admin role required, audited
 *
 * Previously this route was unauthenticated, read `role` from the body, called
 * `setCustomUserClaims`, and spread the whole request body into the Firestore
 * document — so any anonymous caller could make themselves an admin and set
 * arbitrary fields.
 */
export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;
    const actor = await requireUser(request, { checkRevoked: true });
    const isAdmin = ADMIN_ROLES.includes(actor.role);
    const isSelf = actor.uid === userId;

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Decide the role-change question BEFORE any database access. Otherwise a
    // non-admin attempting to escalate still causes a read, and the refusal
    // becomes indistinguishable from a database error.
    const requestedRole = (body as Record<string, unknown>).role;
    if (requestedRole !== undefined) {
      if (!ROLE_CHANGES_ENABLED) {
        return NextResponse.json(
          {
            error:
              'Role changes through the API are disabled. ' +
              'Change roles in the Firebase console while the security review is in progress.',
          },
          { status: 503 }
        );
      }
      if (!isAdmin) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      if (typeof requestedRole !== 'string' || !ASSIGNABLE_ROLES.includes(requestedRole as Role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      // Refused up front: an admin changing their own role is the usual way to
      // lock yourself out, and it removes a self-escalation shape entirely.
      if (isSelf) {
        return NextResponse.json(
          { error: 'An admin cannot change their own role' },
          { status: 400 }
        );
      }
    }

    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ---- profile fields (allowlisted; never a spread of the request body) ----
    const updates: Record<string, string> = {};
    for (const key of SELF_EDITABLE) {
      const value = (body as Record<string, unknown>)[key];
      if (value === undefined) continue;
      if (!isNonEmptyString(value, 200)) {
        return NextResponse.json({ error: `Invalid value for ${key}` }, { status: 400 });
      }
      updates[key] = value.trim();
    }

    // ---- email: identity, so Auth and Firestore must not diverge ----
    const email = (body as Record<string, unknown>).email;
    if (email !== undefined) {
      if (!isNonEmptyString(email, 320) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      }
      await adminAuth.updateUser(userId, { email: email.trim() });
      updates.email = email.trim();
    }

    if (updates.displayName || updates.phoneNumber) {
      await adminAuth.updateUser(userId, {
        ...(updates.displayName ? { displayName: updates.displayName } : {}),
        ...(updates.phoneNumber ? { phoneNumber: updates.phoneNumber } : {}),
      });
    }

    // ---- role: permission already established above ----
    if (typeof requestedRole === 'string') {
      const role = requestedRole;
      const previousRole = (userDoc.data()?.role as string) ?? 'user';
      await adminAuth.setCustomUserClaims(userId, { role });
      // Force re-authentication so the old token stops carrying the old role.
      await adminAuth.revokeRefreshTokens(userId);
      updates.role = role;

      await recordAudit({
        action: 'user.role_change',
        actorUid: actor.uid,
        actorRole: actor.role,
        targetType: 'user',
        targetId: userId,
        details: { from: previousRole, to: role },
      });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No supported fields to update' }, { status: 400 });
    }

    await adminFirestore
      .collection('users')
      .doc(userId)
      .update({ ...updates, updatedAt: new Date().toISOString() });

    const updated = await adminFirestore.collection('users').doc(userId).get();
    return NextResponse.json(updated.data());
  } catch (error) {
    const authed = authErrorResponse(error);
    if (authed) return authed;
    console.error('Error updating user');
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
