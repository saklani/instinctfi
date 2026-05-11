import * as React from "react"

import { cn } from "@/lib/utils"

type DeltaProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Raw decimal — e.g. 0.0234 = +2.34%. Pass `null`/`undefined` to render em-dash. */
  value: number | null | undefined
  /** Whether the underlying number represents a percentage already (true) or a fraction (false, default). */
  asPercent?: boolean
  /** Number of decimals to show. Default 2. */
  precision?: number
  /** Visual density. */
  size?: "sm" | "md" | "lg"
  /** Suppress the ▲/▼ arrow (e.g. inside tables). */
  hideArrow?: boolean
  /** Show a leading sign on positive values (default true). */
  showSign?: boolean
  /** Inline label rendered after the number (e.g. "24h"). */
  suffix?: React.ReactNode
}

const ARROW_UP = "▲"
const ARROW_DOWN = "▼"

const SIZE_MAP: Record<NonNullable<DeltaProps["size"]>, string> = {
  sm: "text-mono-sm gap-0.5",
  md: "text-mono-sm gap-1",
  lg: "text-mono-md gap-1",
}

function Delta({
  value,
  asPercent = false,
  precision = 2,
  size = "md",
  hideArrow = false,
  showSign = true,
  suffix,
  className,
  ...props
}: DeltaProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <span
        data-slot="delta"
        data-tone="neutral"
        className={cn(
          "inline-flex items-center text-ink-faint tabular",
          SIZE_MAP[size],
          className
        )}
        {...props}
      >
        —
      </span>
    )
  }

  const pct = asPercent ? value : value * 100
  const tone = pct > 0 ? "positive" : pct < 0 ? "negative" : "neutral"
  const arrow = pct > 0 ? ARROW_UP : pct < 0 ? ARROW_DOWN : ""
  const sign = pct > 0 && showSign ? "+" : ""
  const formatted = `${sign}${pct.toFixed(precision)}%`

  return (
    <span
      data-slot="delta"
      data-tone={tone}
      className={cn(
        "inline-flex items-center tabular",
        tone === "positive" && "text-positive",
        tone === "negative" && "text-negative",
        tone === "neutral" && "text-ink-muted",
        SIZE_MAP[size],
        className
      )}
      {...props}
    >
      {!hideArrow && arrow && (
        <span aria-hidden className="text-[0.75em]">
          {arrow}
        </span>
      )}
      <span>{formatted}</span>
      {suffix && (
        <span className="text-ink-faint font-sans not-tabular ml-0.5">
          {suffix}
        </span>
      )}
    </span>
  )
}

export { Delta }
