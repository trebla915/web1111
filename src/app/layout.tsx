// File: Layout.tsx
// Description: Layout component wrapping all pages with a header and footer from the components directory.

"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/globals.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-t from-black via-gray-900 to-black text-white min-h-screen">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}