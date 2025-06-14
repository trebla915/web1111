import type { Metadata } from "next";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import StripeProvider from "@/components/providers/StripeProvider";
import { ReservationProvider } from "@/components/providers/ReservationProvider";
import { Toaster } from "react-hot-toast";
import "../styles/globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

export const metadata: Metadata = {
  title: "11:11 | El Paso Texas Music and Concert Venue",
  description: "Experience the best live music and events at 11:11, El Paso's premier music and concert venue featuring world-class performances and unforgettable experiences.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.1111eptx.com"),
  keywords: "music venue, El Paso, 11:11, EPTX, concerts, events, live music, venue, Texas",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.1111eptx.com",
    siteName: "11:11",
    title: "11:11 | El Paso Texas Music and Concert Venue",
    description: "Experience the best live music and events at 11:11, El Paso's premier music and concert venue featuring world-class performances and unforgettable experiences.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "11:11 Music Venue"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "11:11 | El Paso Texas Music and Concert Venue",
    description: "Experience the best live music and events at 11:11, El Paso's premier music and concert venue featuring world-class performances and unforgettable experiences.",
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/1111logo.png" />
        <link rel="icon" type="image/png" href="/1111logo.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="bg-black text-white min-h-screen flex flex-col overflow-x-hidden">
        <AuthProvider>
          <StripeProvider>
            <ReservationProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </ReservationProvider>
          </StripeProvider>
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}