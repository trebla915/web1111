"use client"

import Link from "next/link"
import { FiArrowRight, FiLogOut, FiUser } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { DiagonalMenuIcon } from "@/components/ui/diagonal-menu-icon"
import { SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { SocialLinks } from "@/components/layout/SocialLinks"
import { ACCOUNT_ACTIONS, HOME_NAV_ITEM, MOBILE_NAV, type NavItem } from "@/lib/navigation/site-nav"
import { MobileBrandMark } from "./MobileBrandMark"
import type { HeaderAccount } from "./useHeaderAccount"
import type { useHeaderNavigation } from "./useHeaderNavigation"

type HeaderNavigation = ReturnType<typeof useHeaderNavigation>

/** The drawer's top bar repeats the header's geometry, so its white rule and
 *  close button land exactly where the header's rule and trigger sit. */
const DRAWER_BAR = "relative box-content flex h-16 items-center justify-between border-b-4 border-fg pt-safe pl-4 pr-4"

/**
 * A row is the label and a diagonal stroke from the menu glyph. The stroke
 * draws in on hover or focus and stays on the current item, which also turns
 * cyan and carries `aria-current`, so colour never marks it alone.
 */
const NAV_ROW =
  "group/link relative flex min-h-14 items-center border-b border-line-subtle py-2 font-heading text-3xl uppercase leading-none tracking-wider text-fg " +
  "transition-colors duration-base hover:text-fg data-[active=true]:text-accent-bright " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
const NAV_STROKE =
  "absolute left-1 h-0.5 w-5 origin-center -rotate-[60deg] scale-x-0 rounded-full bg-current transition-transform duration-base ease-out-expo " +
  "group-hover/link:scale-x-100 group-focus-visible/link:scale-x-100 group-data-[active=true]/link:scale-x-100"
const NAV_LABEL =
  "transition-transform duration-base ease-out-expo " +
  "group-hover/link:translate-x-8 group-focus-visible/link:translate-x-8 group-data-[active=true]/link:translate-x-8"

interface MobileNavDrawerProps {
  open: boolean
  nav: HeaderNavigation
  account: HeaderAccount
}

export function MobileNavDrawer({ open, nav, account }: MobileNavDrawerProps) {
  return (
    <SheetContent
      side="right"
      showClose={false}
      // Above the fixed header (z-100), so the backdrop dims the whole page and
      // this panel's own bar replaces the header's for as long as it is open.
      overlayClassName="z-[110]"
      aria-describedby={undefined}
      className="z-[110] flex w-[calc(100%-3.5rem)] max-w-sm flex-col gap-0 border-line bg-canvas p-0 pr-safe"
    >
      <div aria-hidden="true" className="noise pointer-events-none absolute inset-0 opacity-5" />

      <div className={DRAWER_BAR}>
        <SheetTitle className="sr-only">Site menu</SheetTitle>
        <MobileBrandMark overhang={false} onNavigate={nav.followNavItem(HOME_NAV_ITEM)} />
        <SheetClose asChild>
          <Button variant="ghost" size="icon" shape="pill" aria-label="Close menu" className="group">
            <DiagonalMenuIcon open={open} />
          </Button>
        </SheetClose>
      </div>

      <nav aria-label="Main" className="relative flex-1 overflow-y-auto px-6 pt-4">
        <ul>
          {MOBILE_NAV.map((item) => (
            <li key={item.key}>
              <DrawerNavLink item={item} linkProps={nav.linkPropsFor(item)} />
            </li>
          ))}
        </ul>
      </nav>

      <DrawerAccount account={account} closeMenu={nav.closeMenu} />
    </SheetContent>
  )
}

function DrawerNavLink({ item, linkProps }: { item: NavItem; linkProps: ReturnType<HeaderNavigation["linkPropsFor"]> }) {
  return (
    <Link {...linkProps} className={NAV_ROW}>
      <span aria-hidden="true" className={NAV_STROKE} />
      <span className={NAV_LABEL}>{item.label}</span>
      {item.primary && <FiArrowRight aria-hidden="true" size={22} className="ml-auto text-accent-bright" />}
    </Link>
  )
}

function DrawerAccount({ account, closeMenu }: { account: HeaderAccount; closeMenu: () => void }) {
  const signOut = () => {
    account.signOut()
    closeMenu()
  }
  const logIn = () => {
    account.openLogin()
    closeMenu()
  }

  return (
    <div className="relative border-t border-line-subtle px-6 pb-safe pt-5">
      {account.signedIn ? (
        <>
          <p className="truncate text-xs tracking-wide text-fg-muted">
            Signed in as <span className="text-fg-dim">{account.displayName}</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="md">
              <Link href={ACCOUNT_ACTIONS.dashboard.href} onClick={closeMenu}>
                <FiUser aria-hidden="true" size={16} />
                {ACCOUNT_ACTIONS.dashboard.label}
              </Link>
            </Button>
            <Button onClick={signOut} variant="ghost-danger" size="md">
              <FiLogOut aria-hidden="true" size={16} />
              {ACCOUNT_ACTIONS.signOut.label}
            </Button>
          </div>
        </>
      ) : (
        <Button onClick={logIn} variant="outline" size="md" full>
          <FiUser aria-hidden="true" size={16} />
          {ACCOUNT_ACTIONS.logIn.label}
        </Button>
      )}
      <SocialLinks className="-ml-3 mt-3 mb-2" />
    </div>
  )
}
