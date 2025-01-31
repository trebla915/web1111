"use client";

import React from "react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";

const FAQSection: React.FC = () => {
  const [faqRef, faqInView] = useInView({ threshold: 0.3 });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <section
      id="faq"
      ref={faqRef}
      className="py-16 bg-black text-white relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 text-center space-y-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={faqInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold mb-6 text-white"
        >
          FAQ
          <div className="mx-auto mt-4 h-1 bg-white w-24 rounded-full" />
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={faqInView ? { opacity: 1 } : {}}
          className="text-lg mb-8 p-4 border border-white rounded-lg"
        >
          ⚠️ ALL PERSONS, BAGS, AND PERSONAL ITEMS ARE SUBJECT TO SEARCH
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left"
          variants={containerVariants}
          initial="hidden"
          animate={faqInView ? "visible" : "hidden"}
          transition={{ staggerChildren: 0.1 }}
        >
          <div className="space-y-4">
            {[
              "PURSES/BAGS LARGER THAN 8”X6”X2”",
              "WEAPONS (ANY ITEMS THAT MAY BE USED TO CAUSE BODILY HARM)",
              "CONTROLLED SUBSTANCES",
              "EYE DROPS / NASAL SPRAY",
              "OUTSIDE FOOD, DRINK, OR LIQUOR",
              "VITAMINS / SUPPLEMENTS",
              "OVER THE COUNTER MEDICATIONS",
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-4 border border-white rounded-lg hover:bg-white/10 transition-colors"
              >
                🚫 {item}
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
            {[
              "CAMERAS / GO PROS",
              "SELFIE STICKS",
              "COLOGNES / PERFUMES",
              "MARIJUANA PRODUCTS",
              "CHEWING TOBACCO",
              "WHISTLES",
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-4 border border-white rounded-lg hover:bg-white/10 transition-colors"
              >
                🚫 {item}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
};

export default FAQSection;