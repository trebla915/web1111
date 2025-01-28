"use client";

import React from "react";
import { useInView } from "react-intersection-observer";

const FAQSection: React.FC = () => {
  const [faqRef, faqInView] = useInView({ threshold: 0.5 });

  return (
    <section
      id="faq"
      ref={faqRef}
      className={`py-16 bg-black text-white transition-opacity duration-700 ${
        faqInView ? "opacity-100" : "opacity-50"
      }`}
    >
      <div className="max-w-6xl mx-auto text-center space-y-8">
        <h1 className="text-6xl font-bold mb-6 tracking-wider">FAQ</h1>
        <p className="text-lg mb-8">
          ALL PERSONS, BAGS, AND PERSONAL ITEMS ARE SUBJECT TO SEARCH
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <ul className="space-y-3">
            <li>PURSES/BAGS LARGER THAN 8”X6”X2”</li>
            <li>WEAPONS (ANY ITEMS THAT MAY BE USED TO CAUSE BODILY HARM)</li>
            <li>CONTROLLED SUBSTANCES</li>
            <li>EYE DROPS / NASAL SPRAY</li>
            <li>OUTSIDE FOOD, DRINK, OR LIQUOR</li>
            <li>VITAMINS / SUPPLEMENTS</li>
            <li>OVER THE COUNTER MEDICATIONS</li>
          </ul>
          <ul className="space-y-3">
            <li>CAMERAS / GO PROS</li>
            <li>SELFIE STICKS</li>
            <li>COLOGNES / PERFUMES</li>
            <li>MARIJUANA PRODUCTS</li>
            <li>CHEWING TOBACCO</li>
            <li>WHISTLES</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;