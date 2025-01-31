"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import StripeProvider from "@/components/StripeProvider";
import { useAuth } from "@/lib/contexts/AuthProvider";

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const { loading } = useAuth(); // ✅ Removed unused `user`

  return (
    <StripeProvider>
      {/* ✅ Ensure children render properly */}
      {!loading && children}

      {/* ✅ Toast notifications */}
      <Toaster position="top-right" />
    </StripeProvider>
  );
}