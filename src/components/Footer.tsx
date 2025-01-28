"use client";

export default function Footer() {
  return (
    <footer
      className="w-full bg-black text-white py-12"
      style={{
        borderTopWidth: "5px",
        borderTopStyle: "solid",
        borderTopColor: "#222", // Matches the header border
      }}
    >
      <div className="max-w-6xl mx-auto px-4 text-center space-y-6">
        {/* Logo */}
        <div>
          <img src="/logo.png" alt="Logo" className="w-24 h-auto mx-auto" />
        </div>
        {/* Address */}
        <div className="text-sm md:text-base leading-relaxed">
         
          9740 Dyer St., El Paso, Texas
        </div>
        {/* Contact Information */}
        <div className="space-y-4">
          <p>
            <a href="tel:+19154336104" className="text-blue-500 hover:underline">
            +1 (915) 433-6104
            </a>
            <br />
            <a
              href="mailto:info@1111eptx.com"
              className="text-blue-500 hover:underline"
            >
              info@1111eptx.com
            </a>
          </p>
        
        </div>
        {/* Links */}
        <div className="text-sm md:text-base space-x-6">
          <a href="#" className="hover:underline">
            Terms & Policy
          </a>
          <a href="#" className="hover:underline">
            Contact
          </a>
        </div>
        {/* Credits */}
        <div className="text-xs md:text-sm text-gray-400">
          Designed by Trebla <br />
          © 11:11 EPTX. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}