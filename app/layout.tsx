import type { Metadata } from "next";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ClientWrapper from "@/lib/utils/ClientWrapper"
import StripeProvider from "@/components/providers/StripeProvider";
import { ReservationProvider } from "@/components/providers/ReservationProvider";
import { Toaster } from "react-hot-toast";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "11:11 EPTX | Premium Nightclub Experience in El Paso",
  description: "Experience the best nightlife at 11:11 EPTX, featuring world-class DJs, VIP bottle service, and unforgettable events in El Paso, Texas.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.1111eptx.com"),
  keywords: "nightclub, El Paso, 11:11, EPTX, bottle service, events, VIP, DJ, music, nightlife, club",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.1111eptx.com",
    siteName: "11:11 EPTX",
    title: "11:11 EPTX | Premium Nightclub Experience",
    description: "Experience the best nightlife at 11:11 EPTX, featuring world-class DJs, VIP bottle service, and unforgettable events in El Paso, Texas.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "11:11 EPTX Nightclub"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "11:11 EPTX | Premium Nightclub Experience",
    description: "Experience the best nightlife at 11:11 EPTX, featuring world-class DJs, VIP bottle service, and unforgettable events in El Paso, Texas.",
    images: ["/og-image.jpg"],
    creator: "@1111eptx"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_ID" // Replace with your actual verification ID
  },
  alternates: {
    canonical: "https://www.1111eptx.com"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="canonical" href="https://www.1111eptx.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="bg-black text-white min-h-screen flex flex-col overflow-x-hidden">
        <AuthProvider>
          <StripeProvider>
            <ReservationProvider>
              <ClientWrapper>
                <Header />
                <main className="flex-1 flex flex-col">{children}</main>
                <Footer />
              </ClientWrapper>
            </ReservationProvider>
          </StripeProvider>
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}