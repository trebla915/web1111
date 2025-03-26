"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HiOutlineMenu, HiX } from "react-icons/hi"
import { FaFacebook, FaTwitter, FaInstagram, FaUserCircle } from "react-icons/fa"
import { FiChevronDown, FiUser, FiLogOut, FiSettings } from "react-icons/fi"
import Image from "next/image"
import LoginModal from "@/components/Auth/LoginModal"
import { useAuth } from "@/components/providers/AuthProvider"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("")
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const toggleMenu = () => setMenuOpen((prev) => !prev)
  const toggleProfileMenu = () => setProfileMenuOpen((prev) => !prev)

  // Close login modal when user becomes available (after login)
  useEffect(() => {
    if (user && showLogin) {
      setShowLogin(false);
    }
  }, [user, showLogin]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Track scroll position for header styling, visibility, and active section
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update header style based on scroll position
      setScrolled(currentScrollY > 20);
      
      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY.current && currentScrollY > 150 && !menuOpen) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      
      // Update last scroll position
      lastScrollY.current = currentScrollY;
      
      if (!isHomePage) return;
      
      const sections = ["events", "venue", "faq", "contact", "location"];
      
      // Get current scroll position
      const scrollPosition = currentScrollY + 120; // Offset for larger header height
      
      // Default to home if at the top
      if (scrollPosition < 300) {
        setActiveSection("");
        return;
      }
      
      // Find the section that is currently in view
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            return;
          }
        }
      }
    };
    
    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);
    
    // Call once on mount to set initial active section
    handleScroll();
    
    // Clean up
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage, menuOpen]);

  // Smooth scroll to section handler
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    // Only handle if on homepage
    if (isHomePage) {
      e.preventDefault()
      const section = document.getElementById(sectionId)
      if (section) {
        // Close mobile menu if open
        if (menuOpen) setMenuOpen(false)
        
        // Scroll to section with smooth behavior
        section.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }
    }
  }

  // Navigation link that handles both normal links and smooth scrolling
  const NavLink = ({ href, sectionId, children }: { href: string, sectionId?: string, children: React.ReactNode }) => {
    // For the Home link, it should be active when on the home page with no active section
    const isHome = href === "/" && !sectionId;
    
    // For section links on homepage
    const isSectionLink = href === "/" && !!sectionId;
    
    // Check if this link is active
    const isActive = 
      (isHome && pathname === "/" && activeSection === "") || 
      (!isHome && pathname === href) || 
      (isSectionLink && pathname === "/" && sectionId === activeSection);
    
    // For links that should scroll on homepage but navigate on other pages
    if (sectionId) {
      return (
        <a 
          href={isHomePage ? `#${sectionId}` : href}
          onClick={(e) => isHomePage ? scrollToSection(e, sectionId) : null}
          className={`px-4 py-2 transition-colors duration-200 relative ${isActive ? 'text-white' : 'text-gray-300'}`}
        >
          <span className="font-bold text-lg hover:text-white">
            {children}
          </span>
          {isActive && (
            <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-white"></span>
          )}
        </a>
      )
    }
    
    // For regular links
    return (
      <Link 
        href={href} 
        className={`px-4 py-2 transition-colors duration-200 relative ${isActive ? 'text-white' : 'text-gray-300'}`}
      >
        <span className="font-bold text-lg hover:text-white">
          {children}
        </span>
        {isActive && (
          <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-white"></span>
        )}
      </Link>
    )
  }

  return (
    <>
      <header className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 transform ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      } ${
        scrolled ? 'bg-gradient-to-b from-black via-black/80 to-transparent backdrop-blur-sm' : 'bg-gradient-to-b from-black to-transparent'
      }`}>
        {/* Background effects */}
        <div className="absolute inset-0 noise opacity-5"></div>
        
        {/* Header content container */}
        <div className="relative flex flex-col items-center justify-center max-w-7xl mx-auto px-4 z-10">
          {/* Navigation section */}
          <div className="w-full flex items-center justify-center py-4">
            {/* Mobile menu button - moved to left side */}
            <div className="absolute left-4">
              <button
                onClick={toggleMenu}
                className="md:hidden p-2 text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? <HiX size={24} /> : <HiOutlineMenu size={24} />}
              </button>
            </div>
            
            {/* Desktop navigation - centered */}
            <nav
              className={`${
                menuOpen ? "flex absolute top-full left-0 right-0 bg-black/95 border-t border-white/10 shadow-xl" : "hidden md:flex"
              } w-full md:w-auto flex-col md:flex-row md:items-center md:justify-center space-y-1 md:space-y-0 p-4 md:p-0`}
            >
              <NavLink href="/" sectionId="">
                HOME
              </NavLink>
              <NavLink href="/" sectionId="events">
                EVENTS
              </NavLink>
              <NavLink href="/" sectionId="venue">
                VENUE
              </NavLink>
              <NavLink href="/" sectionId="faq">
                RULES
              </NavLink>
              <NavLink href="/" sectionId="contact">
                CONTACT
              </NavLink>
              <NavLink href="/" sectionId="location">
                FIND US
              </NavLink>
              
              {/* Mobile-only user menu */}
              {user && (
                <div className="md:hidden mt-4 w-full border-t border-white/10 pt-4">
                  <Link href="/dashboard" className="flex items-center gap-2 p-2 text-white hover:bg-white/10 rounded transition-colors">
                    <FiUser />
                    <span className="text-base font-bold">DASHBOARD</span>
                  </Link>
                  <button onClick={logout} className="flex w-full items-center gap-2 p-2 text-red-200 hover:bg-red-900/20 rounded transition-colors">
                    <FiLogOut />
                    <span className="text-base font-bold">SIGN OUT</span>
                  </button>
                </div>
              )}
            </nav>
            
            {/* Desktop user controls - moved to right side */}
            <div className="absolute right-4 hidden md:flex items-center space-x-4">
              {/* Auth controls */}
              {user ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center gap-2 py-1 px-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
                    aria-label="Profile menu"
                  >
                    <FaUserCircle className="text-white text-xl" />
                    <span className="hidden sm:inline text-sm">{user.email?.split('@')[0]}</span>
                    <FiChevronDown className={`transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Profile Dropdown */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md overflow-hidden bg-black/95 backdrop-blur-md border border-white/20 shadow-lg shadow-black/20 z-60">
                      <Link 
                        href="/dashboard" 
                        className="flex items-center gap-2 px-4 py-3 text-white hover:bg-white/10 transition-colors"
                      >
                        <FiUser />
                        <span>Dashboard</span>
                      </Link>
                      <button 
                        onClick={logout} 
                        className="flex items-center gap-2 w-full text-left px-4 py-3 text-red-200 hover:bg-red-900/10 transition-colors"
                      >
                        <FiLogOut />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 bg-white text-black font-bold hover:bg-cyan-100 transition-colors"
                >
                  LOGIN
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal rendered at the root level, outside of the header */}
      {showLogin && (
        <div className="fixed inset-0 z-[9999]">
          <LoginModal onClose={() => setShowLogin(false)} />
        </div>
      )}
    </>
  )
}