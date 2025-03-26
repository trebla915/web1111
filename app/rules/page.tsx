"use client";

import FAQFestivalSection from "@/components/sections/FAQFestivalSection";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="flex items-center text-cyan-400 hover:text-cyan-300 mb-8">
          <FiArrowLeft className="mr-2" /> BACK TO HOME
        </Link>
        
        <FAQFestivalSection 
          title="VENUE RULES & POLICIES" 
          className="pt-0"
          showYear={false}
        />
        
        <div className="text-center mt-12">
          <Link 
            href="/" 
            className="inline-block border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black px-8 py-3 transition-colors text-lg font-bold tracking-widest"
          >
            RETURN TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
} 