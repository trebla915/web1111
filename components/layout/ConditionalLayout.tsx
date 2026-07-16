"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/layout/CookieConsent";

interface ConditionalLayoutProps {
  children: ReactNode;
}

// Routes that already have no Header/Footer at all (they build their own chrome).
const NO_CHROME_PREFIXES = ['/admin', '/staff'];

// Task-focused flows where a marketing footer just adds noise/scroll below the fold.
// Header stays (nav back home, login, etc.) — only the Footer is dropped.
const NO_FOOTER_PREFIXES = [
  '/dashboard',
  '/reserve',
  '/reservation',
  '/auth',
  '/profile',
  '/debug',
  '/dev',
];

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const hasNoChrome = NO_CHROME_PREFIXES.some((p) => pathname.startsWith(p));
  const hasNoFooter = NO_FOOTER_PREFIXES.some((p) => pathname.startsWith(p));

  if (hasNoChrome) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      {!hasNoFooter && <Footer />}
      <CookieConsent />
    </>
  );
} 