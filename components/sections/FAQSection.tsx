// FAQSection.tsx
"use client"
import { useState } from "react";
import Section from "@/components/ui/Section";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function FAQSection() {
  return (
    <Section 
      id="faq"
      title="CLUB RULES & FAQ"
      description="EVERYTHING YOU NEED TO KNOW BEFORE YOUR VISIT"
      bgColor="bg-black"
      className="border-t-2 border-cyan-500/30"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        <FAQItem 
          question="DRESS CODE POLICY"
          answer="We maintain an upscale dress code. Smart casual attire is required. No athletic wear, sports jerseys, ripped clothing, or excessively baggy items. Management reserves the right to deny entry based on attire."
        />
        <FAQItem 
          question="AGE REQUIREMENTS"
          answer="All guests must be 21+ with valid government-issued ID. International passports are accepted. Expired IDs will not be accepted under any circumstances."
        />
        <FAQItem 
          question="RESERVATION POLICY"
          answer="Table reservations are recommended for guaranteed entry. Minimum spends apply for VIP tables and bottle service. Reservations must be claimed by 11:30 PM or may be released."
        />
        <FAQItem 
          question="PAYMENT METHODS"
          answer="We accept all major credit cards, mobile payments, and cash. A credit card is required to open and maintain a tab at the bar."
        />
        <FAQItem 
          question="PHOTOGRAPHY POLICY"
          answer="Professional photography equipment is not permitted without prior authorization. By entering the venue, you consent to being photographed or recorded for promotional purposes."
        />
        <FAQItem 
          question="RE-ENTRY POLICY"
          answer="Re-entry is permitted with a valid hand stamp or wristband. All guests must go through security screening upon re-entry."
        />
      </div>
    </Section>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-cyan-500/30 bg-black/80 rounded">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <h3 className="font-bold text-white tracking-wider">{question}</h3>
        {isOpen ? 
          <FiChevronUp className="text-white flex-shrink-0 ml-2" /> : 
          <FiChevronDown className="text-white flex-shrink-0 ml-2" />
        }
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-gray-300">
          <p>{answer}</p>
        </div>
      )}
    </div>
  )
}