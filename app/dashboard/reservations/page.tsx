"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingScreen } from "@/components/ui/spinner";

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
      <LoadingScreen />
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="min-h-screen py-24 px-6 bg-canvas text-fg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Reservations</h1>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-surface-raised rounded-lg hover:bg-surface-hover transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-surface rounded-lg p-6 mb-8">
          <p className="text-fg-dim mb-8">
            You don't have any reservations yet.
          </p>
          
          <Link 
            href="/reserve" 
            className="inline-block px-6 py-3 bg-danger-600 hover:bg-danger-700 text-fg font-semibold rounded-md transition-colors"
          >
            Make a Reservation
          </Link>
        </div>
      </div>
    </div>
  );
}
