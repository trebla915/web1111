"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HiOutlineMenu, HiX } from "react-icons/hi";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import LoginModal from "@/components/Auth/LoginModal";
import { useAuth } from "@/lib/contexts/AuthProvider";
import Image from "next/image";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="fixed w-full top-0 left-0 bg-black text-white z-50 h-16 md:h-20 border-b-4 border-gray-800">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        {/* Left Section - Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image src="/images/logo.png" alt="11:11 Web Logo" width={100} height={50} priority />
        </Link>

        {/* Center Section - Navigation */}
        <nav className="hidden md:flex items-center space-x-6 flex-grow justify-center">
          <button className="px-4 py-2 hover:bg-gray-800/40 rounded-lg transition-all">
            Home
          </button>
          <button className="px-4 py-2 hover:bg-gray-800/40 rounded-lg transition-all">
            Events
          </button>
          <button className="px-4 py-2 hover:bg-gray-800/40 rounded-lg transition-all">
            Reserve
          </button>
          <button className="px-4 py-2 hover:bg-gray-800/40 rounded-lg transition-all">
            FAQ
          </button>
          <button className="px-4 py-2 hover:bg-gray-800/40 rounded-lg transition-all">
            Contact
          </button>
        </nav>

        {/* Right Section - Auth & Social */}
        <div className="flex items-center gap-4">
          {/* Auth Section */}
          {user ? (
            <button
              onClick={logout}
              className="px-4 py-2 border border-white rounded-lg text-white hover:bg-white/10 transition-all"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 border border-white rounded-lg text-white hover:bg-white/10 transition-all"
            >
              Login
            </button>
          )}

          {/* Social Icons */}
          <div className="hidden md:flex items-center space-x-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-800/40 rounded-full transition-colors">
              <FaFacebook size={20} className="text-gray-300" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-800/40 rounded-full transition-colors">
              <FaTwitter size={20} className="text-gray-300" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-800/40 rounded-full transition-colors">
              <FaInstagram size={20} className="text-gray-300" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white p-2 hover:bg-gray-800/40 rounded-lg transition-colors" onClick={toggleMenu}>
            {menuOpen ? <HiX size={24} /> : <HiOutlineMenu size={24} />}
          </button>
        </div>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} className="z-[70]" />
    </header>
  );
}