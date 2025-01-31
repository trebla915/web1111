import type { Metadata } from "next";
import { ReactNode } from "react";
import { AuthProvider } from "@/lib/contexts/AuthProvider";
import Header from "@/components/common/Header/Header";
import Footer from "@/components/common/Footer/Footer";
import ClientWrapper from "@/components/ClientWrapper";
import StripeProvider from "@/components/StripeProvider";
import { Toaster } from "react-hot-toast";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "11:11 EPTX",
  description: "Premium nightclub experience in El Paso, Texas",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    images: "/og-image.jpg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex flex-col">
        <AuthProvider>
          <StripeProvider>
            <ClientWrapper>
              {/* ✅ Header placed correctly */}
              <Header />

              {/* ✅ Fix: Fullscreen layout without extra padding */}
              <main className="flex-1">{children}</main>

              {/* ✅ Fix: Footer should be always at bottom */}
              <Footer />
            </ClientWrapper>
          </StripeProvider>
        </AuthProvider>

        {/* ✅ Ensure Toaster is not affecting layout */}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}