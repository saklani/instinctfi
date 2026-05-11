import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type PillBaseProps = React.ComponentProps<"span">

const PILL_BASE =
  "inline-flex h-5 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 text-xs font-medium"

function Ticker({
  symbol,
  className,
  ...props
}: PillBaseProps & { symbol: string }) {
  const formatted = symbol.startsWith("$") ? symbol : `$${symbol}`
  return (
    <span
      data-slot="ticker"
      className={cn(
        PILL_BASE,
        "bg-secondary font-mono tabular-nums text-foreground",
        className,
      )}
      {...props}
    >
      {formatted}
    </span>
  )
}

function Count({
  className,
  children,
  interactive = false,
  ...props
}: PillBaseProps & { interactive?: boolean }) {
  return (
    <span
      data-slot="count"
      data-interactive={interactive ? "true" : undefined}
      className={cn(
        PILL_BASE,
        "bg-secondary text-muted-foreground",
        interactive && "cursor-pointer hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
      {interactive && <ChevronDown className="size-3" />}
    </span>
  )
}

function Verified({
  className,
  label = "Curated",
  showLabel = true,
  ...props
}: PillBaseProps & { label?: string; showLabel?: boolean }) {
  return (
    <span
      data-slot="verified"
      className={cn(
        PILL_BASE,
        "gap-1.5 bg-secondary text-foreground",
        className,
      )}
      {...props}
    >
      <ScallopedCheck className="size-4 text-accent" />
      {showLabel && <span className="text-xs uppercase tracking-wider">{label}</span>}
    </span>
  )
}

function ScallopedCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 2 13.6 4.1 16.2 3.2 16.7 5.9 19.3 6.6 18.6 9.2 20.5 11.1 18.6 13 19.3 15.6 16.7 16.3 16.2 19 13.6 18.1 12 20.2 10.4 18.1 7.8 19 7.3 16.3 4.7 15.6 5.4 13 3.5 11.1 5.4 9.2 4.7 6.6 7.3 5.9 7.8 3.2 10.4 4.1Z" />
      <path
        d="M8.5 11.5 11 14 16 9"
        stroke="var(--accent-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export { Ticker, Count, Verified, ScallopedCheck }
