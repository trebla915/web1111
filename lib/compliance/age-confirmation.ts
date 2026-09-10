/**
 * 21+ confirmation for the bottle-selection step.
 *
 * WHAT THIS IS
 * ------------
 * An attestation gate. The customer must be signed in AND affirm they are 21
 * or older before any bottle selection is shown. Both conditions are required;
 * neither substitutes for the other.
 *
 * WHAT THIS IS NOT — read before relying on it
 * --------------------------------------------
 * This is NOT age verification. It records that someone ticked a box in a
 * browser. It does not check a document, a date of birth, or any third-party
 * signal, and it cannot detect a false claim.
 *
 * It is also NOT an access control on the images themselves. Bottle images are
 * publicly readable in Cloud Storage, by product decision. A Storage rule can
 * see who is making a request; it cannot see whether a checkbox was ticked in
 * a browser earlier, because browser state produces no evidence a rule can
 * verify. Anyone holding a direct object URL can fetch the image without ever
 * loading the site.
 *
 * So: what is gated is the bottle SELECTION EXPERIENCE in the reservation
 * flow. Direct bottle image URLs are NOT age restricted, and nothing in this
 * file makes them so.
 *
 * The confirmation is stored per-account so one person's attestation is never
 * inherited by the next person to use the same browser.
 */

const PREFIX = "age21:";

/** Storage key for a given account. Never shared between accounts. */
export function ageConfirmationKey(uid: string): string {
  return `${PREFIX}${uid}`;
}

/**
 * Whether this account has confirmed 21+ in this browser.
 *
 * Returns false whenever storage is unavailable — a private window, cleared
 * site data, or a browser configured to block it. Failing closed means the
 * customer is asked again, which is the harmless direction.
 */
export function hasConfirmedAge(uid: string | null | undefined): boolean {
  if (!uid) return false;
  try {
    return window.localStorage.getItem(ageConfirmationKey(uid)) === "true";
  } catch {
    return false;
  }
}

/** Records the attestation. A storage failure is non-fatal: the customer is simply asked again. */
export function recordAgeConfirmation(uid: string | null | undefined): void {
  if (!uid) return;
  try {
    window.localStorage.setItem(ageConfirmationKey(uid), "true");
  } catch {
    /* ignore — hasConfirmedAge will return false and re-prompt */
  }
}

/** Clears it. Used on sign-out so the next account must confirm for itself. */
export function clearAgeConfirmation(uid: string | null | undefined): void {
  if (!uid) return;
  try {
    window.localStorage.removeItem(ageConfirmationKey(uid));
  } catch {
    /* ignore */
  }
}
