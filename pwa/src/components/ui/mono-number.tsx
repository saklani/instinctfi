import * as React from "react"

import { cn } from "@/lib/utils"

type MonoFormat = "usd" | "pct" | "count" | "raw"

type MonoNumberProps = Omit<React.ComponentProps<"span">, "children"> & {
  value: number | string | null | undefined
  format?: MonoFormat
  /** Decimal precision. Defaults: usd=2, pct=2, count=0, raw=2. */
  precision?: number
  /** Show currency or percent suffix (e.g. "USD"). Defaults to none. */
  unit?: React.ReactNode
  /** Visual size. Falls back to inheriting type scale via className when omitted. */
  size?: "xl" | "md" | "sm"
  /** Compact USD/count notation (1.2M, 2.3B). */
  compact?: boolean
}

const SIZE_CLASS: Record<NonNullable<MonoNumberProps["size"]>, string> = {
  xl: "text-mono-xl",
  md: "text-mono-md",
  sm: "text-mono-sm",
}

function defaultPrecision(format: MonoFormat) {
  if (format === "count") return 0
  return 2
}

function formatValue(
  value: number,
  format: MonoFormat,
  precision: number,
  compact: boolean
) {
  if (format === "usd") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      notation: compact ? "compact" : "standard",
    }).format(value)
  }
  if (format === "pct") {
    return `${value.toFixed(precision)}%`
  }
  // count + raw
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: format === "raw" ? precision : 0,
    maximumFractionDigits: precision,
    notation: compact ? "compact" : "standard",
  }).format(value)
}

function MonoNumber({
  value,
  format = "raw",
  precision,
  unit,
  size,
  compact = false,
  className,
  ...props
}: MonoNumberProps) {
  const numeric =
    value === null || value === undefined
      ? null
      : typeof value === "number"
        ? value
        : Number(value)

  const isMissing = numeric === null || Number.isNaN(numeric ?? NaN)
  const resolvedPrecision = precision ?? defaultPrecision(format)
  const formatted = isMissing
    ? "—"
    : formatValue(numeric as number, format, resolvedPrecision, compact)

  return (
    <span
      data-slot="mono-number"
      data-format={format}
      className={cn(
        "tabular font-mono",
        size && SIZE_CLASS[size],
        isMissing && "text-ink-faint",
        className
      )}
      {...props}
    >
      {formatted}
      {unit && !isMissing && (
        <span className="ml-1 text-mono-sm text-ink-faint">{unit}</span>
      )}
    </span>
  )
}

export { MonoNumber, type MonoFormat }
