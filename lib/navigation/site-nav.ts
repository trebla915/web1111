/**
 * Public-site navigation — the one place that says where the header, its
 * mobile drawer and the footer can take a visitor. Components render these
 * lists; they never spell a destination, an order or a label themselves.
 */
import type { IconType } from "react-icons"
import { FiFacebook, FiInstagram } from "react-icons/fi"

/** Homepage sections that carry an `id` a nav item can scroll to, in page order. */
export type SectionId = "events" | "venue" | "faq" | "contact" | "location"

type NavTarget =
  | { kind: "home" }
  | { kind: "section"; sectionId: SectionId }
  | { kind: "route"; href: string }

export interface NavItem {
  key: string
  label: string
  target: NavTarget
  /** The drawer marks this item as the next step rather than a place to read. */
  primary?: boolean
}

export const HOME_HREF = "/"

const ITEMS = {
  home: { key: "home", label: "Home", target: { kind: "home" } },
  events: { key: "events", label: "Events", target: { kind: "section", sectionId: "events" } },
  // Reservations belong to an event (tables, prices and minimums are set per
  // night), so there is no standalone booking page: a table starts from the
  // event list.
  reserve: { key: "reserve", label: "Reserve a table", target: { kind: "route", href: "/events" }, primary: true },
  venue: { key: "venue", label: "Venue", target: { kind: "section", sectionId: "venue" } },
  rules: { key: "rules", label: "Rules", target: { kind: "section", sectionId: "faq" } },
  contact: { key: "contact", label: "Contact", target: { kind: "section", sectionId: "contact" } },
  findUs: { key: "find-us", label: "Find us", target: { kind: "section", sectionId: "location" } },
} as const satisfies Record<string, NavItem>

/** The mobile logo's destination. */
export const HOME_NAV_ITEM: NavItem = ITEMS.home

/** The desktop bar, unchanged in order and destination. */
export const DESKTOP_NAV: readonly NavItem[] = [
  ITEMS.home,
  ITEMS.events,
  ITEMS.venue,
  ITEMS.rules,
  ITEMS.contact,
  ITEMS.findUs,
]

/** The mobile drawer. Home is the logo, so the list leads with what guests came for. */
export const MOBILE_NAV: readonly NavItem[] = [
  ITEMS.events,
  ITEMS.reserve,
  ITEMS.venue,
  ITEMS.rules,
  ITEMS.contact,
  ITEMS.findUs,
]

/** Every section a nav item points at, in page order — what scroll-spy watches. */
export const TRACKED_SECTION_IDS: readonly SectionId[] = Object.values(ITEMS).flatMap((item) =>
  item.target.kind === "section" ? [item.target.sectionId] : []
)

/** On the homepage a section link is an in-page anchor; elsewhere it leads back to it. */
export function navHref(item: NavItem, isHomePage: boolean): string {
  switch (item.target.kind) {
    case "home":
      return HOME_HREF
    case "section":
      return isHomePage ? `#${item.target.sectionId}` : `${HOME_HREF}#${item.target.sectionId}`
    case "route":
      return item.target.href
  }
}

/** `activeSection` is the scroll-spy result: `null` means the top of the homepage. */
export function isNavItemActive(item: NavItem, pathname: string, activeSection: SectionId | null): boolean {
  switch (item.target.kind) {
    case "home":
      return pathname === HOME_HREF && activeSection === null
    case "section":
      return pathname === HOME_HREF && activeSection === item.target.sectionId
    case "route":
      return pathname === item.target.href || pathname.startsWith(`${item.target.href}/`)
  }
}

/** A route is the page you are on; a homepage section is where you are on it. */
export function ariaCurrentFor(item: NavItem): "page" | "location" {
  return item.target.kind === "route" ? "page" : "location"
}

/**
 * What a click should do in place instead of navigating: scroll to a section
 * or to the top. Only on the homepage — anywhere else the href is a real
 * navigation.
 */
export type InPageScroll = { to: "top" } | { to: "section"; sectionId: SectionId }

export function inPageScrollFor(item: NavItem, isHomePage: boolean): InPageScroll | null {
  if (!isHomePage) return null
  if (item.target.kind === "home") return { to: "top" }
  if (item.target.kind === "section") return { to: "section", sectionId: item.target.sectionId }
  return null
}

/** Signed-in and signed-out actions, shared by the desktop menu and the drawer. */
export const ACCOUNT_ACTIONS = {
  dashboard: { href: "/dashboard", label: "Dashboard" },
  signOut: { label: "Sign out" },
  logIn: { label: "Log in" },
} as const

export interface SocialLink {
  network: string
  href: string
  Icon: IconType
}

/**
 * The venue's real accounts only. A Twitter/X link used to sit here pointing at
 * bare `twitter.com` — no 11:11 handle exists — so it sent guests nowhere.
 * Add a network back when there is a real profile URL for it.
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { network: "Instagram", href: "https://www.instagram.com/1111eptx/", Icon: FiInstagram },
  { network: "Facebook", href: "https://www.facebook.com/1111eptx/", Icon: FiFacebook },
]
