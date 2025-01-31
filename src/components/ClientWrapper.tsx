"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import StripeProvider from "@/components/StripeProvider";
import { useAuth } from "@/lib/contexts/AuthProvider";

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  return (
    <StripeProvider>
      {/* ✅ Debugging Content */}
      <div className="bg-blue-500 text-white p-4 text-center">
        DEBUG: ClientWrapper is Rendering | Loading: {loading ? "True" : "False"}
      </div>

      {/* ✅ Temporarily render everything even if user isn't logged in */}
      {children}

      <Toaster position="top-right" />
    </StripeProvider>
  );
}