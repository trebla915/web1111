"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
          <Button asChild variant="subtle" size="md">
            <Link href="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="bg-surface rounded-lg p-6 mb-8">
          <p className="text-fg-dim mb-8">
            You don't have any reservations yet.
          </p>
          
          <Button asChild variant="primary" size="lg">
            <Link href="/reserve">
              Make a Reservation
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
