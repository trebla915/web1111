"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthProvider"; // ✅ Now correctly using AuthProvider
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login"); // ✅ Use replace() to prevent infinite loop
    }
  }, [user, loading, router]);

  if (loading) return <Loader />; // ✅ Show loader until authentication state is confirmed

  return user ? <>{children}</> : null;
}