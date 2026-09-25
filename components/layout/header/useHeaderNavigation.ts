"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import {
  HOME_HREF,
  TRACKED_SECTION_IDS,
  ariaCurrentFor,
  inPageScrollFor,
  isNavItemActive,
  navHref,
  type NavItem,
  type SectionId,
} from "@/lib/navigation/site-nav"

/** Scroll distance after which the header may hide, and before which it always shows. */
const HIDE_AFTER_PX = 80
/** Ignore scroll jitter smaller than this when deciding hide/show. */
const SCROLL_DELTA_PX = 8
/** Past this, the page is no longer "at the top" and the logo tucks into the bar. */
const TOP_THRESHOLD_PX = 16
/** Scroll-spy reports no section above this, so Home stays current over the hero. */
const SPY_START_PX = 300
/** The line (below the fixed header) a section must cross to become current. */
const SPY_LINE_PX = 120

/** The app scrolls inside #__scroll-root (see globals.css), not the window. */
function getScrollRoot(): HTMLElement | null {
  return typeof document === "undefined" ? null : document.getElementById("__scroll-root")
}

function currentSection(): SectionId | null {
  for (const id of TRACKED_SECTION_IDS) {
    const rect = document.getElementById(id)?.getBoundingClientRect()
    if (rect && rect.top <= SPY_LINE_PX && rect.bottom >= SPY_LINE_PX) return id
  }
  return null
}

/**
 * Everything the header decides: whether it is hidden, whether the mobile
 * logo hangs into the hero, which nav item is current, and what a nav click
 * does. The header components only render the answers.
 */
export function useHeaderNavigation() {
  const pathname = usePathname()
  const isHomePage = pathname === HOME_HREF

  const [menuOpen, setMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [atTop, setAtTop] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)
  const lastScrollY = useRef(0)
  const scrollTicking = useRef(false)

  useEffect(() => {
    const scrollRoot = getScrollRoot()
    const getScrollY = () => (scrollRoot ? scrollRoot.scrollTop : window.scrollY)

    const updateFromScroll = () => {
      scrollTicking.current = false
      const currentScrollY = getScrollY()

      const scrollDelta = currentScrollY - lastScrollY.current
      if (scrollDelta > SCROLL_DELTA_PX && currentScrollY > HIDE_AFTER_PX && !menuOpen) {
        setHidden(true)
      } else if (scrollDelta < -SCROLL_DELTA_PX || currentScrollY <= HIDE_AFTER_PX) {
        setHidden(false)
      }
      lastScrollY.current = currentScrollY
      setAtTop(currentScrollY <= TOP_THRESHOLD_PX)

      if (!isHomePage) return
      if (currentScrollY < SPY_START_PX) {
        setActiveSection(null)
        return
      }
      // In the gap between two sections, the last one crossed stays current.
      const section = currentSection()
      if (section) setActiveSection(section)
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

  /**
   * Closes the drawer and, on the homepage, scrolls in place instead of
   * navigating. Anywhere else the link's href is a real navigation.
   */
  const followNavItem = useCallback(
    (item: NavItem) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      setMenuOpen(false)
      const scroll = inPageScrollFor(item, isHomePage)
      if (!scroll) return
      event.preventDefault()
      if (scroll.to === "top") {
        getScrollRoot()?.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        document.getElementById(scroll.sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    },
    [isHomePage]
  )

  const linkPropsFor = useCallback(
    (item: NavItem) => {
      const active = isNavItemActive(item, pathname, activeSection)
      return {
        href: navHref(item, isHomePage),
        onClick: followNavItem(item),
        "aria-current": active ? ariaCurrentFor(item) : undefined,
        "data-active": active,
      }
    },
    [pathname, activeSection, isHomePage, followNavItem]
  )

  return {
    menuOpen,
    setMenuOpen,
    closeMenu: () => setMenuOpen(false),
    hidden,
    /** The mobile logo hangs into the hero only at the very top of the homepage. */
    logoOverhang: isHomePage && atTop,
    linkPropsFor,
    followNavItem,
  }
}
