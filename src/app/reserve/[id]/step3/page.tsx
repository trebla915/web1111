"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { calculateTotal, createPaymentIntent } from "@/lib/api/paymentService";
import { useAuth } from "@/lib/contexts/AuthProvider";
import PaymentForm from "@/components/reservation/PaymentForm";
import Loader from "@/components/ui/Loader";
import type { Bottle } from "@/types/bottle";

export default function Step3Page() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract reservation details
  const tableId = searchParams.get("tableId");
  const tablePrice = parseFloat(searchParams.get("tablePrice") || "0");
  const tableNumber = searchParams.get("tableNumber") || "Unknown Table";
  const guests = searchParams.get("guests") || "1";
  const bottles: Bottle[] = JSON.parse(searchParams.get("bottles") || "[]");

  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchTotal = async () => {
      try {
        // ✅ Calculate total price
        const { total: totalAmount } = calculateTotal(tablePrice, bottles);
        const numericTotal = parseFloat(totalAmount.toString());

        if (isNaN(numericTotal)) {
          throw new Error("Invalid total received");
        }

        setTotal(numericTotal);

        // ✅ Create Payment Intent (Amount in cents)
        const paymentData = {
          amount: Math.round(numericTotal * 100),
          metadata: {
            name: user.displayName || "Guest",
            email: user.email || "",
            eventName: "Event Name",
            tableNumber,
            guests,
          },
          reservationDetails: {
            userId: user.uid,
            eventId: searchParams.get("eventId") || "Unknown Event",
            tableId: tableId || "Unknown Table",
          },
        };

        const paymentIntent = await createPaymentIntent(paymentData);
        setClientSecret(paymentIntent.clientSecret);
      } catch (err) {
        setError("Failed to calculate total or initialize payment.");
      } finally {
        setLoading(false);
      }
    };

    fetchTotal();
  }, [user]);

  if (!user) {
    return <div className="text-center text-red-500">You must be logged in to reserve a table.</div>;
  }

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-black px-4">
      <div className="max-w-4xl w-full space-y-6 p-8 border border-white/20 backdrop-blur-lg rounded-xl bg-black/50">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-white">
          Confirm Your Reservation
        </h1>

        {/* Payment Breakdown - Transparent Background ✅ */}
        <div className="p-6 border border-white/20 rounded-lg bg-transparent space-y-3">
          {/* ✅ Table Number Display */}
          <div className="flex justify-between">
            <span className="text-gray-400">Table Selected</span>
            <span className="font-bold">{tableNumber}</span>
          </div>

          {/* ✅ Show Table Price */}
          <div className="flex justify-between">
            <span className="text-gray-400">Table Price</span>
            <span className="font-bold">${tablePrice.toFixed(2)}</span>
          </div>

          {/* ✅ Show Bottles Selected */}
          {bottles.length > 0 && (
            <>
              <hr className="border-gray-700" />
              {bottles.map((bottle) => (
                <div key={bottle.id} className="flex justify-between">
                  <span className="text-gray-400">{bottle.name}</span>
                  <span className="font-bold">${bottle.price.toFixed(2)}</span>
                </div>
              ))}
            </>
          )}

          <hr className="border-gray-700" />

          {/* ✅ Show Total */}
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>${total?.toFixed(2)}</span>
          </div>
        </div>

        {/* ✅ Payment Form - Fixed Width (No extra title here) */}
        {clientSecret ? (
          <PaymentForm 
            clientSecret={clientSecret} 
            amount={Math.round((total || 0) * 100)}  
            onSuccess={() => console.log("Payment successful!")} 
          />
        ) : (
          <div className="text-red-500 text-center">Error initializing payment.</div>
        )}

        {/* ✅ Only "Go Back" button remains */}
        <div className="flex justify-center w-full">
          <button
            onClick={() => router.back()}
            className="w-1/2 py-3 px-6 border border-white text-white rounded-lg font-bold transition-all hover:bg-white hover:text-black"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}