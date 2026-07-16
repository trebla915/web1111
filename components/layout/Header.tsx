"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HiOutlineMenu, HiX } from "react-icons/hi"
import { FaFacebook, FaTwitter, FaInstagram, FaUserCircle } from "react-icons/fa"
import { FiChevronDown, FiUser, FiLogOut } from "react-icons/fi"
import LoginModal from "@/components/Auth/LoginModal"
import { useAuth } from "@/components/providers/AuthProvider"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_ITEMS: { label: string; sectionId: string }[] = [
  { label: "HOME", sectionId: "" },
  { label: "EVENTS", sectionId: "events" },
  { label: "VENUE", sectionId: "venue" },
  { label: "RULES", sectionId: "faq" },
  { label: "CONTACT", sectionId: "contact" },
  { label: "FIND US", sectionId: "location" },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("")
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)
  const scrollTicking = useRef(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  // Close login modal when user becomes available (after login)
  useEffect(() => {
    if (user && showLogin) {
      setShowLogin(false)
    }
  }, [user, showLogin])

  // Track scroll position for header styling, visibility, and active section
  // Use #__scroll-root when present (iOS scroll wrapper), else window
  useEffect(() => {
    const scrollRoot = typeof document !== "undefined" ? document.getElementById("__scroll-root") : null
    const getScrollY = () => (scrollRoot ? scrollRoot.scrollTop : window.scrollY)

    const updateFromScroll = () => {
      scrollTicking.current = false
      const currentScrollY = getScrollY()

      const scrollDelta = currentScrollY - lastScrollY.current
      if (scrollDelta > 8 && currentScrollY > 80 && !menuOpen) {
        setHidden(true)
      } else if (scrollDelta < -8 || currentScrollY <= 80) {
        setHidden(false)
      }

      lastScrollY.current = currentScrollY

      if (!isHomePage) return

      const sections = ["events", "venue", "faq", "contact", "location"]
      const headerOffset = 120

      if (currentScrollY < 300) {
        setActiveSection("")
        return
      }

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= headerOffset && rect.bottom >= headerOffset) {
            setActiveSection(section)
            return
          }
        }
      }
    }

    const handleScroll = () => {
      if (scrollTicking.current) return
      scrollTicking.current = true
      requestAnimationFrame(updateFromScroll)
    }

    const target = scrollRoot ?? window
    target.addEventListener("scroll", handleScroll, { passive: true })
    updateFromScroll()

    return () => target.removeEventListener("scroll", handleScroll)
  }, [isHomePage, menuOpen])

  const isNavItemActive = (sectionId: string) => pathname === "/" && activeSection === sectionId

  // Handles both smooth-scrolling to a section on the homepage and closing
  // the mobile menu. Section links to other pages fall through to a normal
  // Next.js navigation to "/".
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    setMenuOpen(false)
    if (isHomePage && sectionId) {
      e.preventDefault()
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const desktopLinkClassName = (sectionId: string) =>
    `whitespace-nowrap transition-colors duration-200 text-sm font-medium tracking-widest font-display ${
      isNavItemActive(sectionId) ? "text-white" : "text-gray-400 hover:text-white"
    }`

  const mobileLinkClassName = (sectionId: string) =>
    `block py-3 px-4 w-full text-center rounded-lg text-xl font-medium transition-colors font-display tracking-wider ${
      isNavItemActive(sectionId) ? "text-white bg-white/10" : "text-gray-300 hover:text-white hover:bg-white/5"
    }`

  const navHref = (sectionId: string) => (sectionId === "" ? "/" : isHomePage ? `#${sectionId}` : "/")

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
          <div className="relative w-full flex items-center justify-between gap-4">
            {/* Left: mobile menu trigger + desktop wordmark */}
            <div className="flex items-center">
              <div className="md:hidden">
                <button
                  onClick={() => setMenuOpen(true)}
                  className="p-3 text-white rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Open menu"
                >
                  <HiOutlineMenu size={24} />
                </button>
              </div>
              <Link href="/" className="hidden md:block text-lg font-display tracking-wider text-white hover:text-white/80 transition-colors">
                11:11
              </Link>
            </div>

            {/* Desktop navigation — centered in the space between the wordmark and the right controls,
                so it can never crowd or overlap them regardless of viewport width */}
            <nav className="hidden md:flex flex-1 justify-center min-w-0">
              <div className="flex items-center gap-6 bg-black/80 backdrop-blur-sm rounded-full px-6 py-2 border border-white/10 shadow-lg">
                {NAV_ITEMS.map((item) => (
                  <Link key={item.label} href={navHref(item.sectionId)} onClick={(e) => handleNavClick(e, item.sectionId)} className={desktopLinkClassName(item.sectionId)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Desktop user controls and social media - fixed to right */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Social Media Icons */}
              <div className="flex items-center space-x-4">
                <a href="https://www.facebook.com/1111eptx/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <FaFacebook size={20} />
                </a>
                <a href="https://www.instagram.com/1111eptx/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <FaInstagram size={20} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <FaTwitter size={20} />
                </a>
              </div>

              {/* Auth controls */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 border border-white/10 hover:border-white/20 outline-none"
                      aria-label="Profile menu"
                    >
                      <FaUserCircle className="text-white text-xl" />
                      <span className="hidden sm:inline text-sm">{user.email?.split("@")[0]}</span>
                      <FiChevronDown size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <FiUser className="mr-1" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive">
                      <FiLogOut className="mr-1" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

      {/* Mobile menu — proper drawer: focus trap, backdrop, tap-outside/Escape to close, scroll lock all built in */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-4/5 max-w-xs flex flex-col">
          <SheetHeader>
            <SheetTitle className="font-display tracking-wider">11:11</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 mt-4">
            {NAV_ITEMS.map((item) => (
              <Link key={item.label} href={navHref(item.sectionId)} onClick={(e) => handleNavClick(e, item.sectionId)} className={mobileLinkClassName(item.sectionId)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-4">
            {user ? (
              <>
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
                    logout()
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 p-2 text-red-200 hover:bg-red-900/20 rounded transition-colors"
                >
                  <FiLogOut />
                  <span className="text-base font-bold">SIGN OUT</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowLogin(true)
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 p-2 text-white hover:bg-white/10 rounded transition-colors"
              >
                <FiUser />
                <span className="text-base font-bold">LOGIN</span>
              </button>
            )}

            {/* Social links in mobile menu */}
            <div className="flex items-center gap-4 mt-4 px-2">
              <a href="https://www.facebook.com/1111eptx/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                <FaFacebook size={20} />
              </a>
              <a href="https://www.instagram.com/1111eptx/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                <FaInstagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                <FaTwitter size={20} />
              </a>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Login Modal rendered at the root level, outside of the header */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
