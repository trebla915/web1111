"use client";

/**
 * Keeps the reservation flow behind the single Reserve-button confirmation.
 *
 * The 21+ popup lives on the event page, shown when the customer presses
 * Reserve. Every step of `/reserve/[id]` therefore assumes the confirmation
 * already happened. Someone who lands on a reservation URL directly — a shared
 * link, a bookmark, a back button after clearing site data — has not confirmed,
 * and must be sent back to the event page to go through the same popup.
 *
 * It sends them back rather than showing a second inline prompt. There used to
 * be two different age prompts in this flow with two different wordings; one
 * gate, in one place, is the whole point of this module.
 *
 * See lib/compliance/age-confirmation.ts for what the confirmation does and
 * does not prove.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { hasConfirmedAge } from "@/lib/compliance/age-confirmation";

type GuardState = "checking" | "allowed" | "redirecting";

/**
 * @param eventId  Event whose page owns the Reserve popup.
 * @param uid      Signed-in account, or null/undefined while unknown.
 * @param enabled  False while auth is still resolving, so the guard does not
 *                 bounce a customer who is merely not loaded yet.
 */
export function useAgeConfirmationGuard(
  eventId: string | undefined,
  uid: string | null | undefined,
  enabled: boolean
): GuardState {
  const router = useRouter();
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    if (!enabled || !eventId) return;

    // No account is not this guard's problem — the pages already redirect to
    // sign-in, and bouncing to the event page instead would lose that reason.
    if (!uid) {
      setState("checking");
      return;
    }

    if (hasConfirmedAge(uid)) {
      setState("allowed");
      return;
    }

    setState("redirecting");
    toast.error("Please confirm your age to reserve a table.");
    router.replace(`/events/${eventId}`);
  }, [enabled, eventId, uid, router]);

  return state;
}
