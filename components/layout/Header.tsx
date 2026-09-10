"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HiOutlineMenu, HiX } from "react-icons/hi"
import { FaFacebook, FaTwitter, FaInstagram, FaUserCircle } from "react-icons/fa"
import { FiChevronDown, FiUser, FiLogOut } from "react-icons/fi"
import { cn } from "@/lib/utils"
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
import { Button } from "@/components/ui/button";

/** One source for the venue's social links, so the header and its drawer can
 *  never drift apart on URL, order or accessible name. */
const SOCIAL_LINKS = [
  { href: "https://www.facebook.com/1111eptx/", label: "11:11 on Facebook", Icon: FaFacebook },
  { href: "https://www.instagram.com/1111eptx/", label: "11:11 on Instagram", Icon: FaInstagram },
  { href: "https://twitter.com", label: "11:11 on Twitter", Icon: FaTwitter },
] as const

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
    // `py-2` is the hit area: these were 20px-tall text links, which is a
    // small target even for a mouse and a poor one on a touch laptop.
    `flex items-center whitespace-nowrap rounded-full px-1 py-2 font-display text-sm font-medium tracking-widest transition-colors duration-200 ${
      isNavItemActive(sectionId) ? "text-fg" : "text-fg-muted hover:text-fg"
    }`

  const mobileLinkClassName = (sectionId: string) =>
    `block py-3 px-4 w-full text-center rounded-lg text-xl font-medium transition-colors font-display tracking-wider ${
      isNavItemActive(sectionId) ? "text-fg bg-fg/10" : "text-fg-dim hover:text-fg hover:bg-fg/5"
    }`

  const navHref = (sectionId: string) => (sectionId === "" ? "/" : isHomePage ? `#${sectionId}` : "/")

  return (
    <>
      <header
        className={cn(
          // `h-16` with `pt-safe` was a fixed 64px box that then had the notch
          // inset added *inside* it, squeezing the row. The height is now the
          // content box, so the safe-area padding extends the header instead.
          "fixed top-0 left-0 z-[100] box-content h-16 w-full border-b-4 border-fg bg-canvas text-fg",
          "pt-safe pl-safe pr-safe transition-transform duration-base ease-out-expo will-change-transform",
          hidden ? "-translate-y-full" : "translate-y-0"
        )}
      >
        {/* Full-bleed: this sat inside the centred container below, so on a wide
            screen the grain stopped at the container edge and the outer thirds
            of the bar were flat. */}
        <div aria-hidden="true" className="noise pointer-events-none absolute inset-0 opacity-5" />

        <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-4 md:px-6">

          {/* Header content container */}
          <div className="relative w-full flex items-center justify-between gap-4">
            {/* Left: mobile menu trigger + desktop wordmark */}
            <div className="flex items-center">
              <div className="md:hidden">
                <Button
                  onClick={() => setMenuOpen(true)}
                  variant="ghost" size="md" className="p-3 rounded-full hover:bg-fg/10"
                  aria-label="Open menu"
                >
                  <HiOutlineMenu size={24} />
                </Button>
              </div>
              <Link href="/" className="hidden md:block text-lg font-display tracking-wider text-fg hover:text-fg/80 transition-colors">
                11:11
              </Link>
            </div>

            {/* Desktop navigation — centered in the space between the wordmark and the right controls,
                so it can never crowd or overlap them regardless of viewport width */}
            <nav className="hidden md:flex flex-1 justify-center min-w-0">
              <div className="flex items-center gap-6 bg-canvas/80 backdrop-blur-sm rounded-full px-6 py-2 border border-fg/10 shadow-lg">
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
              {/* Icon-only links with no text and no `aria-label` announced as
                  bare "link" — three in a row, indistinguishable. The 44px box
                  also gives them a real touch target on a hybrid laptop. */}
              <div className="flex items-center">
                {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} (opens in a new tab)`}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-fg-dim transition-colors hover:bg-fg/10 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon aria-hidden="true" size={19} />
                  </a>
                ))}
              </div>

              {/* Auth controls */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost" size="sm" className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-fg/10 hover:bg-fg/20 text-fg border border-fg/10 hover:border-fg/20"
                      aria-label="Profile menu"
                    >
                      <FaUserCircle className="text-fg text-xl" />
                      <span className="hidden sm:inline text-sm">{user.email?.split("@")[0]}</span>
                      <FiChevronDown size={16} />
                    </Button>
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
                /* This was a white filled circle holding a person glyph — the
                   universal "you are signed in" avatar — offered to visitors who
                   are signed out. It says what it does now. */
                <Button onClick={() => setShowLogin(true)} variant="primary" size="md">
                  <FiUser aria-hidden="true" size={16} />
                  <span>Log in</span>
                </Button>
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

          <div className="mt-auto border-t border-fg/10 pt-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 p-2 text-fg hover:bg-fg/10 rounded transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <FiUser />
                  <span className="text-base font-bold">DASHBOARD</span>
                </Link>
                <Button
                  onClick={() => {
                    logout()
                    setMenuOpen(false)
                  }}
                  variant="ghost" size="md" full className="flex items-center gap-2 p-2 text-danger-200 hover:bg-danger-900/20 rounded"
                >
                  <FiLogOut />
                  <span className="text-base font-bold">SIGN OUT</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setShowLogin(true)
                  setMenuOpen(false)
                }}
                variant="ghost" size="md" full className="flex items-center gap-2 p-2 hover:bg-fg/10 rounded"
              >
                <FiUser />
                <span className="text-base font-bold">LOGIN</span>
              </Button>
            )}

            {/* Social links in mobile menu */}
            <div className="mt-3 flex items-center">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} (opens in a new tab)`}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-fg-dim transition-colors hover:bg-fg/10 hover:text-fg"
                >
                  <Icon aria-hidden="true" size={20} />
                </a>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Login Modal rendered at the root level, outside of the header */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
