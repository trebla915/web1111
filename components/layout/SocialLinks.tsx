import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SOCIAL_LINKS } from "@/lib/navigation/site-nav"

/**
 * The venue's social accounts as 44px icon links. Header, drawer and footer
 * all render this, so they can't drift apart on URL, order or accessible name.
 */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={cn("flex items-center", className)}>
      {SOCIAL_LINKS.map(({ network, href, Icon }) => (
        <li key={network}>
          <Button asChild variant="ghost" size="icon" shape="pill">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`11:11 on ${network} (opens in a new tab)`}
            >
              <Icon aria-hidden="true" size={20} />
            </a>
          </Button>
        </li>
      ))}
    </ul>
  )
}
