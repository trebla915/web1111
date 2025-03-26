"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ReservationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="min-h-screen py-24 px-6 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Reservations</h1>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <p className="text-gray-300 mb-8">
            You don't have any reservations yet.
          </p>
          
          <Link 
            href="/reserve" 
            className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors"
          >
            Make a Reservation
          </Link>
        </div>
      </div>
    </div>
  );
}
