"use client"

import Link from "next/link"
import { FaUserCircle } from "react-icons/fa"
import { FiChevronDown, FiUser, FiLogOut } from "react-icons/fi"
import { cn } from "@/lib/utils"
import LoginModal from "@/components/Auth/LoginModal"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { DiagonalMenuIcon } from "@/components/ui/diagonal-menu-icon"
import { SocialLinks } from "@/components/layout/SocialLinks"
import { ACCOUNT_ACTIONS, DESKTOP_NAV, HOME_HREF, HOME_NAV_ITEM } from "@/lib/navigation/site-nav"
import { MobileBrandMark } from "./header/MobileBrandMark"
import { MobileNavDrawer } from "./header/MobileNavDrawer"
import { useHeaderAccount, type HeaderAccount } from "./header/useHeaderAccount"
import { useHeaderNavigation } from "./header/useHeaderNavigation"

// `py-2` is the hit area: these were 20px-tall text links, which is a small
// target even for a mouse and a poor one on a touch laptop.
const DESKTOP_LINK =
  "flex items-center whitespace-nowrap rounded-full px-1 py-2 font-display text-sm font-medium uppercase tracking-widest transition-colors duration-200 " +
  "text-fg-muted hover:text-fg data-[active=true]:text-fg"

export default function Header() {
  const nav = useHeaderNavigation()
  const account = useHeaderAccount()

  return (
    // The Sheet root is context only (no DOM). It wraps the header so the menu
    // button is a real SheetTrigger, with `aria-expanded` and focus return.
    <Sheet open={nav.menuOpen} onOpenChange={nav.setMenuOpen}>
      <header
        className={cn(
          // `h-16` with `pt-safe` was a fixed 64px box that then had the notch
          // inset added *inside* it, squeezing the row. The height is now the
          // content box, so the safe-area padding extends the header instead.
          "fixed top-0 left-0 z-[100] box-content h-16 w-full border-b-4 border-fg bg-canvas text-fg",
          "pt-safe pl-safe pr-safe transition-transform duration-base ease-out-expo will-change-transform",
          // Hiding also clears the mobile logo's overhang below the bar.
          nav.hidden ? "-translate-y-[calc(100%+var(--header-logo-drop))]" : "translate-y-0"
        )}
      >
        {/* Full-bleed: this sat inside the centred container below, so on a wide
            screen the grain stopped at the container edge and the outer thirds
            of the bar were flat. */}
        <div aria-hidden="true" className="noise pointer-events-none absolute inset-0 opacity-5" />

        <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-4 md:px-6">
          <div className="relative flex w-full items-center justify-between gap-4">
            {/* Mobile: the mark leads the bar, the menu button closes it. */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
              <MobileBrandMark overhang={nav.logoOverhang} onNavigate={nav.followNavItem(HOME_NAV_ITEM)} />
            </div>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" shape="pill" aria-label="Open menu" className="group ml-auto md:hidden">
                <DiagonalMenuIcon open={nav.menuOpen} />
              </Button>
            </SheetTrigger>

            <Link href={HOME_HREF} className="hidden md:block text-lg font-display tracking-wider text-fg hover:text-fg/80 transition-colors">
              11:11
            </Link>

            {/* Desktop navigation — centered in the space between the wordmark and the right controls,
                so it can never crowd or overlap them regardless of viewport width */}
            <nav aria-label="Main" className="hidden md:flex flex-1 justify-center min-w-0">
              <div className="flex items-center gap-6 bg-canvas/80 backdrop-blur-sm rounded-full px-6 py-2 border border-fg/10 shadow-lg">
                {DESKTOP_NAV.map((item) => (
                  <Link key={item.key} {...nav.linkPropsFor(item)} className={DESKTOP_LINK}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="hidden md:flex items-center space-x-6">
              <SocialLinks />
              <DesktopAccount account={account} />
            </div>
          </div>
        </div>
      </header>

      <MobileNavDrawer open={nav.menuOpen} nav={nav} account={account} />

      {/* Login Modal rendered at the root level, outside of the header */}
      {account.loginOpen && <LoginModal onClose={account.closeLogin} />}
    </Sheet>
  )
}

function DesktopAccount({ account }: { account: HeaderAccount }) {
  if (!account.signedIn) {
    /* This was a white filled circle holding a person glyph — the universal
       "you are signed in" avatar — offered to visitors who are signed out. It
       says what it does now. */
    return (
      <Button onClick={account.openLogin} variant="primary" size="md">
        <FiUser aria-hidden="true" size={16} />
        <span>{ACCOUNT_ACTIONS.logIn.label}</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="subtle" size="sm" shape="pill" aria-label="Profile menu">
          <FaUserCircle className="text-fg text-xl" />
          <span className="hidden sm:inline text-sm">{account.displayName}</span>
          <FiChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={ACCOUNT_ACTIONS.dashboard.href} className="cursor-pointer">
            <FiUser className="mr-1" />
            <span>{ACCOUNT_ACTIONS.dashboard.label}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={account.signOut} className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive">
          <FiLogOut className="mr-1" />
          <span>{ACCOUNT_ACTIONS.signOut.label}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
