"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiCheck, FiUsers } from "react-icons/fi";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import StripeProvider from "@/components/providers/StripeProvider";
import {
  getAvailableTablesForReservation,
  changeReservationTable,
  type ChangeTableInitResponse,
  type ChangeTableSuccessResponse,
} from "@/lib/services/reservations";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function PaymentStep({
  clientSecret,
  amountDue,
  reservationId,
  newTableId,
  paymentIntentId,
  onSuccess,
}: {
  clientSecret: string;
  amountDue: number;
  reservationId: string;
  newTableId: string;
  paymentIntentId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setError(null);
    try {
      const returnUrl = `${window.location.origin}/reservation/${reservationId}/change-table?newTableId=${encodeURIComponent(newTableId)}`;
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });
      if (submitError) {
        setError(submitError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }
      const result = await changeReservationTable(reservationId, newTableId, paymentIntentId);
      if ("success" in result && result.success) {
        onSuccess();
      } else {
        setError("Table was updated but we couldn't refresh. Check your reservation.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-zinc-300 text-sm">
        Pay the price difference of <strong className="text-cyan-400">{formatCurrency(amountDue)}</strong> (including service fee).
      </p>
      <div className="p-4 border border-zinc-700 rounded-lg bg-zinc-900/50">
        <PaymentElement
          options={{
            layout: "tabs",
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#0891b2",
                colorBackground: "#18181b",
                colorText: "#ffffff",
                borderRadius: "8px",
              },
            },
          }}
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing…" : `Pay ${formatCurrency(amountDue)} & change table`}
      </button>
    </form>
  );
}

export default function ChangeTablePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = params?.reservationId as string;
  const completedRedirectRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    tables: Array<{ id: string; number: number; price: number; reserved: boolean }>;
    currentTableId: string;
    currentTableNumber: number;
    event: { title?: string; date?: string } | null;
    reservation: { id: string; guestCount?: number; totalAmount?: number };
  } | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<ChangeTableInitResponse | null>(null);
  const [success, setSuccess] = useState<ChangeTableSuccessResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // After Stripe redirect (3DS etc.), complete the table change
  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");
    const redirectStatus = searchParams.get("redirect_status");
    const newTableIdFromUrl = searchParams.get("newTableId");
    if (
      !completedRedirectRef.current &&
      reservationId &&
      paymentIntent &&
      redirectStatus === "succeeded" &&
      newTableIdFromUrl
    ) {
      completedRedirectRef.current = true;
      changeReservationTable(reservationId, newTableIdFromUrl, paymentIntent)
        .then((result) => {
          if ("success" in result && result.success) {
            setSuccess(result);
            router.replace(`/reservation/${reservationId}/change-table`);
          } else {
            setError("Could not complete table change. Please try again.");
          }
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to complete"))
        .finally(() => setLoading(false));
      return;
    }
    if (!reservationId) return;
    getAvailableTablesForReservation(reservationId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [reservationId, searchParams, router]);

  const currentTable = data?.tables.find((t) => t.id === data.currentTableId);
  const selectedTable = data?.tables.find((t) => t.id === selectedTableId);
  const otherTables = data?.tables.filter((t) => t.id !== data?.currentTableId && !t.reserved);
  const priceDiff = currentTable && selectedTable ? selectedTable.price - currentTable.price : 0;
  const priceDiffWithFee = Math.round(priceDiff * 1.1 * 100) / 100;
  const isUpgrade = priceDiffWithFee > 0;
  const isDowngrade = priceDiffWithFee < 0;

  const handleSelectTable = async () => {
    if (!reservationId || !selectedTableId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await changeReservationTable(reservationId, selectedTableId);
      if ("needsPayment" in result && result.needsPayment) {
        setPaymentStep(result);
      } else if ("success" in result && result.success) {
        setSuccess(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change table");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentStep(null);
    setSelectedTableId(null);
    setSuccess({
      success: true,
      message: "Table changed successfully.",
      reservation: {} as any,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse">Loading…</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/" className="text-cyan-400 hover:underline">Back to home</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 rounded-xl p-8 text-center border border-zinc-800">
          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-7 h-7 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Table changed</h1>
          <p className="text-zinc-400 mb-6">{success.message}</p>
          {success.refund && (
            <p className="text-cyan-400 text-sm mb-6">
              A refund of {formatCurrency(success.refund.amount)} will be processed to your original payment method.
            </p>
          )}
          <Link
            href="/dashboard/reservations"
            className="block w-full py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 text-center"
          >
            View my reservations
          </Link>
          <Link href="/events" className="block mt-3 text-zinc-400 hover:text-white text-sm">
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  if (paymentStep) {
    return (
      <div className="min-h-screen bg-black text-white py-24 px-4">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setPaymentStep(null)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="text-2xl font-bold mb-2">Pay price difference</h1>
          <p className="text-zinc-400 mb-6">
            Moving from Table #{paymentStep.currentTableNumber} to Table #{paymentStep.newTableNumber}.
          </p>
          <StripeProvider clientSecret={paymentStep.clientSecret}>
            <PaymentStep
              clientSecret={paymentStep.clientSecret}
              amountDue={paymentStep.amountDue}
              reservationId={reservationId}
              newTableId={paymentStep.newTableId}
              paymentIntentId={paymentStep.paymentIntentId}
              onSuccess={handlePaymentSuccess}
            />
          </StripeProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-24 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href="/dashboard/reservations"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
        >
          <FiArrowLeft /> My reservations
        </Link>
        <h1 className="text-2xl font-bold mb-1">Change your table</h1>
        {data?.event?.title && (
          <p className="text-zinc-400 mb-6">{data.event.title}</p>
        )}
        <p className="text-zinc-400 text-sm mb-6">
          Your current table is <strong className="text-white">#{data?.currentTableNumber}</strong>.
          Select a different available table below. You may owe an extra charge or receive a refund depending on the table price.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-8">
          {otherTables?.map((table) => {
            const diff = currentTable ? table.price - currentTable.price : 0;
            const diffWithFee = Math.round(diff * 1.1 * 100) / 100;
            const isCurrent = table.id === data?.currentTableId;
            return (
              <button
                key={table.id}
                type="button"
                disabled={isCurrent}
                onClick={() => setSelectedTableId(table.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedTableId === table.id
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
                } ${isCurrent ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-white">Table #{table.number}</span>
                    <span className="text-zinc-400 ml-2">· {formatCurrency(table.price)}</span>
                  </div>
                  {!isCurrent && diff !== 0 && (
                    <span className={diffWithFee > 0 ? "text-amber-400" : "text-green-400"}>
                      {diffWithFee > 0 ? `+${formatCurrency(diffWithFee)}` : formatCurrency(diffWithFee)} (refund)
                    </span>
                  )}
                </div>
                {table.capacity != null && (
                  <div className="flex items-center gap-1 mt-1 text-zinc-500 text-sm">
                    <FiUsers className="w-3.5 h-3.5" /> Up to {table.capacity} guests
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {otherTables?.length === 0 && (
          <p className="text-zinc-500">No other tables available for this event.</p>
        )}

        {selectedTableId && selectedTable && (
          <div className="border-t border-zinc-800 pt-6">
            <p className="text-zinc-400 text-sm mb-2">
              Selected: Table #{selectedTable.number} ({formatCurrency(selectedTable.price)})
              {priceDiff !== 0 && (
                <span className={isUpgrade ? "text-amber-400" : "text-green-400"}>
                  {" "}
                  · {isUpgrade ? `Pay ${formatCurrency(priceDiffWithFee)}` : `Refund ${formatCurrency(Math.abs(priceDiffWithFee))}`}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={handleSelectTable}
              disabled={submitting}
              className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                "Processing…"
              ) : isUpgrade ? (
                <>Pay {formatCurrency(priceDiffWithFee)} & change table</>
              ) : isDowngrade ? (
                <>Confirm change & get {formatCurrency(Math.abs(priceDiffWithFee))} refund</>
              ) : (
                <>Confirm move to Table #{selectedTable.number}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
