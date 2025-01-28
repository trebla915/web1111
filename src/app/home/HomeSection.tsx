"use client";

import React from "react";
import { useInView } from "react-intersection-observer";

const HomeSection: React.FC = () => {
  const [homeRef, homeInView] = useInView({ threshold: 0.5 });

  return (
    <section
      id="home"
      ref={homeRef}
      className={`min-h-[70vh] flex items-center justify-center transition-opacity duration-700 ${
        homeInView ? "opacity-100" : "opacity-50"
      }`}
    >
      <div className="text-center">
        <img src="/logo.png" alt="Logo" className="w-[300px] h-auto mx-auto" />
      </div>
    </section>
  );
};

export default HomeSection;