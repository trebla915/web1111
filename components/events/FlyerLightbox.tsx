"use client"

import Image from "next/image"
import Link from "next/link"
import { FiArrowRight, FiX } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface FlyerLightboxProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  flyerUrl?: string
  detailsHref?: string
}

/** Shared full-screen flyer viewer for event lists and event details. */
export function FlyerLightbox({
  open,
  onOpenChange,
  title,
  flyerUrl,
  detailsHref,
}: FlyerLightboxProps) {
  const source = flyerUrl || "/placeholder-event.png"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        aria-describedby={undefined}
        className="inset-0 left-0 top-0 z-[200] flex h-dvh max-w-none translate-x-0 translate-y-0 flex-col gap-3 rounded-none border-0 bg-canvas/95 p-4 pb-safe pt-safe shadow-none"
      >
        <DialogTitle className="sr-only">Flyer for {title}</DialogTitle>

        <div className="flex h-12 shrink-0 items-center justify-end">
          <DialogClose asChild>
            <Button variant="outline" size="icon" shape="pill" aria-label="Close flyer">
              <FiX aria-hidden="true" size={24} />
            </Button>
          </DialogClose>
        </div>

        <div className="relative min-h-0 flex-1 touch-pinch-zoom">
          <Image
            src={source}
            alt={`Flyer for ${title}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
            unoptimized={source.includes("firebasestorage.googleapis.com") || source.includes("storage.googleapis.com")}
          />
        </div>

        {detailsHref && (
          <div className="flex shrink-0 justify-center pb-3">
            <DialogClose asChild>
              <Button asChild variant="primary" size="lg">
                <Link href={detailsHref}>
                  View event details
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
