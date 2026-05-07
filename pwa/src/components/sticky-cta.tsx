import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type StickyCtaProps = {
  /** Click handler (typically opens a Sheet). */
  onClick?: () => void
  /** Render a chevron-down to signal it expands a sheet. */
  expandable?: boolean
  disabled?: boolean
  className?: string
  ariaLabel?: string
  children: React.ReactNode
}

/** Mobile-only fixed bottom CTA. Inset above the bottom tab bar + safe-area. */
export function StickyCta({
  onClick,
  expandable = false,
  disabled = false,
  className,
  ariaLabel,
  children,
}: StickyCtaProps) {
  return (
    <div
      data-slot="sticky-cta"
      className={cn(
        "fixed left-4 right-4 z-40 md:hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "flex h-14 w-full items-center justify-center rounded-full",
          "bg-primary text-primary-foreground select-none",
          "shadow-md transition-shadow duration-200 hover:shadow-lg",
          "active:translate-y-px active:duration-[80ms]",
          "outline-none focus-visible:ring-[4px] focus-visible:ring-ring",
          "disabled:opacity-60",
        )}
      >
        <span className="font-mono text-sm font-medium uppercase tracking-wider tabular-nums">
          {children}
        </span>
        {expandable && (
          <ChevronDown
            aria-hidden
            className="size-4"
          />
        )}
      </button>
    </div>
  )
}
