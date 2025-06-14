"use client";

import LoginForm from "@/components/Auth/LoginForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

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
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // If the user is already authenticated, don't render anything (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Member Login</h2>
        <LoginForm />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}