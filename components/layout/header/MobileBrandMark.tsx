import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { HOME_HREF } from "@/lib/navigation/site-nav"

/**
 * /1111logo.png is a 1920×1080 canvas with the mark floating in the middle:
 * it occupies x 493–1415 and y 355–747, about 48% of the width and 36% of the
 * height. The box below is the mark's own 922:392 shape, and the image is
 * oversized and offset inside it so that only the mark lands in the box. The
 * percentages are those bounds divided by the mark's size. Re-derive them if
 * the asset is ever re-exported.
 */
const MARK_BOX = "relative aspect-[922/392] w-32"
const MARK_IMAGE = "absolute -left-[53.5%] -top-[90.5%] w-[208.2%] max-w-none"

/** A soft white halo keeps the hairline outline legible at header size. */
const MARK_GLOW = "drop-shadow-mark"

interface MobileBrandMarkProps {
  /** Drop the mark out of the bar into the hero (top of the homepage only). */
  overhang: boolean
  onNavigate: React.MouseEventHandler<HTMLAnchorElement>
}

/**
 * The 11:11 mark in the mobile bar. The link is a 44px strip inside the bar.
 * The part of the mark that hangs below the bar is `pointer-events-none`, so
 * it never catches a tap meant for the hero behind it.
 */
export function MobileBrandMark({ overhang, onNavigate }: MobileBrandMarkProps) {
  return (
    <Link
      href={HOME_HREF}
      onClick={onNavigate}
      aria-label="11:11 EPTX home"
      className="relative flex h-11 w-32 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      <span
        aria-hidden="true"
        data-overhang={overhang}
        className={cn(
          MARK_BOX,
          "group/mark pointer-events-none origin-left transition-transform duration-slow ease-out-expo",
          "data-[overhang=true]:translate-y-[var(--header-logo-drop)] data-[overhang=false]:scale-[0.72]"
        )}
      >
        {/* A black plate behind the overhanging mark breaks the header's white rule
            where the mark passes through it, rather than letting the rule
            strike through the outline. */}
        <span className="absolute -inset-x-2 inset-y-1 bg-canvas opacity-0 transition-opacity duration-slow group-data-[overhang=true]/mark:opacity-100" />
        <Image
          src="/1111logo.png"
          alt=""
          width={1920}
          height={1080}
          sizes="267px"
          loading="eager"
          className={cn(MARK_IMAGE, MARK_GLOW)}
        />
      </span>
    </Link>
  )
}
