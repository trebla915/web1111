"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HiOutlineMenu, HiX } from "react-icons/hi";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header
      className="fixed w-full top-0 left-0 bg-black/60 backdrop-blur-lg text-white z-50 h-20"
      style={{
        borderBottomWidth: "5px",
        borderBottomStyle: "solid",
        borderBottomColor: "#222",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <img
            src="/logo.png"
            alt="11:11 Web Logo"
            className="h-10"
          />{" "}
          {/* Replace /logo.png with your logo path */}
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-8 text-lg">
          <a href="#home" className="hover:text-gray-300">
            Home
          </a>
          <a href="#faq" className="hover:text-gray-300">
            FAQ
          </a>
          <a href="#events" className="hover:text-gray-300">
            Events
          </a>
          <a href="#reserve" className="hover:text-gray-300">
            Reserve
          </a>
        </nav>

        {/* Social Media Icons */}
        <div className="hidden md:flex items-center space-x-4">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFacebook size={20} className="hover:text-gray-300" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTwitter size={20} className="hover:text-gray-300" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaInstagram size={20} className="hover:text-gray-300" />
          </a>
        </div>

        {/* Login Button */}
        <div className="hidden md:flex">
          <Link
            href="/login"
            className="bg-gray-800 px-4 py-2 rounded text-white hover:bg-gray-700"
          >
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="block md:hidden text-white"
          onClick={toggleMenu}
        >
          {menuOpen ? <HiX size={28} /> : <HiOutlineMenu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-xl space-y-4">
          <a
            href="#home"
            className="hover:text-gray-300"
            onClick={toggleMenu}
          >
            Home
          </a>
          <a
            href="#faq"
            className="hover:text-gray-300"
            onClick={toggleMenu}
          >
            FAQ
          </a>
          <a
            href="#events"
            className="hover:text-gray-300"
            onClick={toggleMenu}
          >
            Events
          </a>
          <a
            href="#reserve"
            className="hover:text-gray-300"
            onClick={toggleMenu}
          >
            Reserve
          </a>
          <div className="flex space-x-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebook size={20} className="hover:text-gray-300" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitter size={20} className="hover:text-gray-300" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram size={20} className="hover:text-gray-300" />
            </a>
          </div>
          <Link
            href="/login"
            className="bg-gray-800 px-4 py-2 rounded text-white hover:bg-gray-700"
          >
            Login
          </Link>
        </div>
      )}
    </header>
  );
}