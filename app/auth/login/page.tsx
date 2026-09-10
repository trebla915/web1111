"use client";

import LoginForm from "@/components/Auth/LoginForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { LoadingScreen } from "@/components/ui/spinner";

function LoginPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') || '/dashboard';

  useEffect(() => {
    // If user is already authenticated, redirect
    if (user && !loading) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  // Don't render the form while checking authentication
  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  // If the user is already authenticated, don't render anything (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-24 text-fg">
      <div className="w-full max-w-md rounded-lg border border-line-accent/30 bg-surface p-6 sm:p-8">
        <h1 className="mb-1 text-center font-heading text-2xl tracking-wide">Sign in</h1>
        <p className="mb-6 text-center text-sm text-fg-muted">
          Reserve tables and manage your bookings.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <LoadingScreen />
    }>
      <LoginPageContent />
    </Suspense>
  );
}