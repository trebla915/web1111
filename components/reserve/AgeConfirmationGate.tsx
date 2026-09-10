"use client";

/**
 * Blocks the bottle-selection step until the customer is signed in AND has
 * affirmed they are 21 or older.
 *
 * See lib/compliance/age-confirmation.ts for what this does and does not
 * prove. In short: it gates the selection experience, not the image bytes.
 */

import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { hasConfirmedAge, recordAgeConfirmation } from "@/lib/compliance/age-confirmation";

interface AgeConfirmationGateProps {
  /** Rendered only once the customer is signed in and has confirmed. */
  children: React.ReactNode;
  /** Called when the customer declines, so the caller can close the panel. */
  onDecline?: () => void;
}

export function AgeConfirmationGate({ children, onDecline }: AgeConfirmationGateProps) {
  const { user, loading } = useAuth();
  // `null` until the client has read storage, so the server-rendered markup and
  // the first client render agree and nothing flashes.
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    setConfirmed(hasConfirmedAge(user?.uid));
  }, [user?.uid, loading]);

  if (loading || confirmed === null) {
    return (
      <div className="p-6 text-center text-zinc-400" role="status">
        Loading…
      </div>
    );
  }

  // Sign-in is required independently of the confirmation. The reservation
  // flow already redirects unauthenticated visitors, so this is a backstop
  // that keeps the component correct wherever it is used.
  if (!user) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-bold text-white">Sign in to choose bottles</h3>
        <p className="mt-2 text-sm text-zinc-400">
          You need an account before selecting bottle service.
        </p>
      </div>
    );
  }

  if (confirmed) return <>{children}</>;

  return (
    <div
      className="p-6 text-center"
      role="group"
      aria-labelledby="age-gate-heading"
      data-testid="age-confirmation-gate"
    >
      <h3 id="age-gate-heading" className="text-lg font-bold text-white">
        Confirm your age
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
        Bottle service is available only to guests aged 21 or older. Confirm
        your age to view bottle selections. Valid ID is required at the door.
      </p>

      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            recordAgeConfirmation(user.uid);
            setConfirmed(true);
          }}
          className="rounded-md bg-white px-5 py-3 font-medium text-black transition-colors hover:bg-white/90"
        >
          I am 21 or older
        </button>
        <button
          type="button"
          onClick={() => onDecline?.()}
          className="rounded-md border border-white/20 px-5 py-3 font-medium text-white transition-colors hover:bg-white/10"
        >
          I am under 21
        </button>
      </div>
    </div>
  );
}
