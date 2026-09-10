import "server-only";

import { adminFirestore } from "@/lib/firebase/admin";

/**
 * Append-only audit trail for privileged actions.
 *
 * Records who did what, to which record, and when. The actor is always the
 * *verified* uid from the ID token — never a display name supplied in the
 * request body, which is how `cancel` previously attributed refunds
 * (`staffName` came straight from the client).
 *
 * Deliberately stores no customer PII: ids and amounts only, so the audit log
 * itself does not become a second copy of the customer database.
 */
export type AuditAction =
  | "reservation.cancel"
  | "reservation.refund"
  | "reservation.delete"
  | "reservation.update"
  | "reservation.change_table"
  | "user.role_change"
  | "event.create"
  | "event.update"
  | "event.delete"
  | "table.update"
  | "bottle.update"
  | "notification.send";

export async function recordAudit(entry: {
  action: AuditAction;
  actorUid: string;
  actorRole: string;
  targetType: "reservation" | "user" | "event" | "table" | "bottle" | "notification";
  targetId: string;
  /** Ids, amounts, status transitions. Never names, emails or phone numbers. */
  details?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  try {
    await adminFirestore.collection("auditLog").add({
      ...entry,
      details: entry.details ?? {},
      at: new Date().toISOString(),
    });
  } catch (error) {
    // An audit write must never take down the operation it describes, but a
    // silent failure would be worse — surface it in logs for alerting.
    console.error("[audit] failed to record", entry.action, entry.targetId, error);
  }
}
