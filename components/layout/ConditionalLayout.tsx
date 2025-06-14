"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/layout/CookieConsent";

interface ConditionalLayoutProps {
  children: ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    // Admin routes get clean layout without header/footer
    return <main className="flex-1">{children}</main>;
  }

  // Regular routes get full layout with header/footer
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieConsent />
    </>
  );
} 