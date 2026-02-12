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
  // Use #__scroll-root when present (iOS scroll wrapper), else window
  useEffect(() => {
    const scrollRoot = typeof document !== "undefined" ? document.getElementById("__scroll-root") : null;

    const getScrollY = () => (scrollRoot ? scrollRoot.scrollTop : window.scrollY);

    const handleScroll = () => {
      const currentScrollY = getScrollY();

      setScrolled(currentScrollY > 20);

      const scrollDelta = currentScrollY - lastScrollY.current;
      if (scrollDelta > 8 && currentScrollY > 80 && !menuOpen) {
        setHidden(true);
      } else if (scrollDelta < -8 || currentScrollY <= 80) {
        setHidden(false);
      }

      lastScrollY.current = currentScrollY;

      if (!isHomePage) return;

      const sections = ["events", "venue", "faq", "contact", "location"];
      const headerOffset = 120;

      if (currentScrollY < 300) {
        setActiveSection("");
        return;
      }

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= headerOffset && rect.bottom >= headerOffset) {
            setActiveSection(section);
            return;
          }
        }
      }
    };

    const target = scrollRoot ?? window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => target.removeEventListener("scroll", handleScroll);
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
          className={`px-0.5 py-0 transition-all duration-200 relative rounded-full text-2xl font-medium ${
            isActive 
              ? 'text-white' 
              : 'text-gray-300 hover:text-white'
          } font-['Digital-7'] tracking-wider`}
        >
          {children}
        </a>
      )
    }
    
    // For regular links
    return (
      <Link 
        href={href} 
        onClick={() => setMenuOpen(false)}
        className={`px-0.5 py-0 transition-all duration-200 relative rounded-full text-2xl font-medium ${
          isActive 
            ? 'text-white' 
            : 'text-gray-300 hover:text-white'
        } font-['Digital-7'] tracking-wider`}
      >
        {children}
      </Link>
    )
  }

  // Mobile navigation items with click handling
  const MobileNavItem = ({ href, sectionId, children }: { href: string, sectionId?: string, children: React.ReactNode }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Close mobile menu
      setMenuOpen(false);
      
      // Use scrollToSection for section links
      if (isHomePage && sectionId) {
        scrollToSection(e, sectionId);
      }
    };

    return (
      <NavLink href={href} sectionId={sectionId}>
        <div 
          className="py-3 px-4 w-full text-center"
          onClick={handleClick}
        >
          {children}
        </div>
      </NavLink>
    );
  };

  return (
    <>
      <header
        className="fixed w-full top-0 left-0 bg-black text-white z-[100] h-16 md:h-16 border-b-4 border-white pt-safe pl-safe pr-safe transition-transform duration-300 ease-out"
        style={{ transform: hidden ? "translate3d(0, -100%, 0)" : "translate3d(0, 0, 0)" }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          {/* Background effects */}
          <div className="absolute inset-0 noise opacity-5"></div>
          
          {/* Header content container */}
          <div className="relative w-full flex items-center justify-between">
            {/* Mobile menu button - fixed to left */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="p-3 text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? <HiX size={24} /> : <HiOutlineMenu size={24} />}
              </button>
            </div>
            
            {/* Desktop navigation - centered with unique design */}
            <nav
              className={`${
                menuOpen ? "flex absolute top-full left-0 right-0 bg-black/95 border-t border-white/10 shadow-xl z-50" : "hidden md:flex"
              } w-full md:w-auto flex-col md:flex-row md:items-center md:justify-center space-y-1 md:space-y-0 p-4 md:p-0 md:absolute md:left-1/2 md:-translate-x-1/2 md:bg-black/80 md:backdrop-blur-sm md:rounded-full md:px-4 md:py-1.5 md:border md:border-white/10 md:shadow-lg`}
            >
              {/* Mobile menu items */}
              <div className="flex md:hidden flex-col space-y-3 w-full">
                <MobileNavItem href="/" sectionId="">
                  HOME
                </MobileNavItem>
                <MobileNavItem href="/" sectionId="events">
                  EVENTS
                </MobileNavItem>
                <MobileNavItem href="/" sectionId="venue">
                  VENUE
                </MobileNavItem>
                <MobileNavItem href="/" sectionId="faq">
                  RULES
                </MobileNavItem>
                <MobileNavItem href="/" sectionId="contact">
                  CONTACT
                </MobileNavItem>
                <MobileNavItem href="/" sectionId="location">
                  FIND US
                </MobileNavItem>
              </div>

              {/* Desktop menu items */}
              <div className="hidden md:flex items-center">
                <div className="flex items-center">
                  <NavLink href="/" sectionId="">
                    HOME
                  </NavLink>
                  <div className="w-px h-4 mx-2 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
                  <NavLink href="/" sectionId="events">
                    EVENTS
                  </NavLink>
                  <div className="w-px h-4 mx-2 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
                  <NavLink href="/" sectionId="venue">
                    VENUE
                  </NavLink>
                  <div className="w-px h-4 mx-2 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
                  <NavLink href="/" sectionId="faq">
                    RULES
                  </NavLink>
                  <div className="w-px h-4 mx-2 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
                  <NavLink href="/" sectionId="contact">
                    CONTACT
                  </NavLink>
                  <div className="w-px h-4 mx-2 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
                  <NavLink href="/" sectionId="location">
                    FIND US
                  </NavLink>
                </div>
              </div>
              
              {/* Mobile-only user menu */}
              {user && (
                <div className="md:hidden mt-4 w-full border-t border-white/10 pt-4">
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-2 p-2 text-white hover:bg-white/10 rounded transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <FiUser />
                    <span className="text-base font-bold">DASHBOARD</span>
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }} 
                    className="flex w-full items-center gap-2 p-2 text-red-200 hover:bg-red-900/20 rounded transition-colors"
                  >
                    <FiLogOut />
                    <span className="text-base font-bold">SIGN OUT</span>
                  </button>
                </div>
              )}
              {!user && (
                <div className="md:hidden mt-4 w-full border-t border-white/10 pt-4">
                  <button 
                    onClick={() => {
                      setShowLogin(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 p-2 text-white hover:bg-white/10 rounded transition-colors"
                  >
                    <FiUser />
                    <span className="text-base font-bold">LOGIN</span>
                  </button>
                </div>
              )}
            </nav>
            
            {/* Desktop user controls and social media - fixed to right with unique design */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Social Media Icons */}
              <div className="flex items-center space-x-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <FaFacebook size={20} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <FaInstagram size={20} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <FaTwitter size={20} />
                </a>
              </div>

              {/* Auth controls */}
              {user ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 border border-white/10 hover:border-white/20"
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
                  className="p-2.5 bg-gradient-to-r from-white/90 to-white text-black font-bold hover:from-white hover:to-white/90 transition-all duration-300 rounded-full shadow-lg shadow-white/20 hover:shadow-white/30"
                  aria-label="Login"
                >
                  <FiUser className="text-xl" />
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