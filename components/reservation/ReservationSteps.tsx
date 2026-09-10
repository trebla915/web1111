"use client"

import * as React from "react"
import { FiCheck } from "react-icons/fi"

import { cn } from "@/lib/utils"

/**
 * Where the guest is in the five-step booking flow.
 *
 * The flow previously gave no signal at all: five pages that each looked like a
 * standalone screen, so a guest on the contact step had no way to tell how much
 * was left before they were asked for a card. Progress is the one thing a
 * checkout owes the person paying.
 *
 * Rendered as an ordered list so assistive tech reads it as a sequence, with
 * the current step carrying `aria-current="step"`.
 */

export const RESERVATION_STEPS = [
  { key: "table", label: "Table", shortLabel: "Table" },
  { key: "details", label: "Details", shortLabel: "Details" },
  { key: "contact", label: "Contact", shortLabel: "Contact" },
  { key: "payment", label: "Payment", shortLabel: "Pay" },
  { key: "confirmation", label: "Confirmed", shortLabel: "Done" },
] as const

export type ReservationStepKey = (typeof RESERVATION_STEPS)[number]["key"]

export function ReservationSteps({
  current,
  className,
}: {
  current: ReservationStepKey
  className?: string
}) {
  const currentIndex = RESERVATION_STEPS.findIndex((s) => s.key === current)

  return (
    <nav aria-label="Reservation progress" className={cn("w-full", className)}>
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {RESERVATION_STEPS.map((step, i) => {
          const done = i < currentIndex
          const active = i === currentIndex

          return (
            <li key={step.key} className="flex min-w-0 flex-1 flex-col gap-1.5">
              {/* The rail is the progress bar; the label sits under its own
                  segment so the two never drift apart on a narrow screen. */}
              <span
                aria-hidden="true"
                className={cn(
                  "h-1 w-full rounded-full transition-colors duration-base ease-out-expo",
                  done && "bg-accent-bright",
                  active && "bg-fg",
                  !done && !active && "bg-line-subtle"
                )}
              />
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1 truncate text-[0.6875rem] font-medium uppercase tracking-wider sm:text-xs",
                  active && "text-fg",
                  done && "text-accent-bright",
                  !done && !active && "text-fg-subtle"
                )}
              >
                {/* Hidden on a phone: at a fifth of 390px the tick pushed
                    "Contact" into "Conta…". The completed rail above already
                    says the step is done. */}
                {done && <FiCheck aria-hidden="true" className="hidden shrink-0 sm:block" size={12} />}
                <span className="truncate">
                  <span className="sr-only">
                    {done ? "Completed: " : active ? "Current step: " : "Upcoming: "}
                  </span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * The header every reservation step shares: progress, the event being booked,
 * and the step's own title. Previously each page invented its own centred
 * heading block at a different size and padding, and none of them said which
 * event the guest was in the middle of booking.
 */
export function ReservationStepHeader({
  step,
  eventName,
  eventDate,
  title,
  description,
  aside,
}: {
  step: ReservationStepKey
  eventName?: string
  eventDate?: string
  title: string
  description?: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <header className="mb-8 space-y-5">
      <ReservationSteps current={step} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eventName && (
            <p className="truncate text-sm text-fg-muted">
              {eventName}
              {eventDate && (
                <>
                  {" · "}
                  <span className="tabular">{eventDate}</span>
                </>
              )}
            </p>
          )}
          <h1 className="mt-1 font-heading text-2xl tracking-wide text-fg sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-prose text-sm text-fg-dim">{description}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </header>
  )
}
