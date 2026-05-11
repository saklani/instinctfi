import * as React from "react"
import { useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import { durations } from "./easings"

type TickerProps = Omit<React.ComponentProps<"span">, "children"> & {
  value: number
  /** Fixed decimal places. */
  decimals?: number
  /** Optional formatter — runs against the interpolated number each frame. */
  format?: (value: number) => string
  /** Override duration in seconds. */
  duration?: number
  /** Prefix (e.g. "$"). */
  prefix?: string
  /** Suffix (e.g. "%"). */
  suffix?: string
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * CountUp number ticker. Animates from previous value → next on change.
 * Default 800ms ease-out per spec. Reduced motion → instant render.
 */
export function Ticker({
  value,
  decimals = 2,
  format,
  duration = durations.ticker,
  prefix,
  suffix,
  className,
  ...props
}: TickerProps) {
  const reduce = useReducedMotion()
  const [animated, setAnimated] = React.useState(value)
  const previousRef = React.useRef(value)
  const frameRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (reduce) {
      previousRef.current = value
      return
    }

    const from = previousRef.current
    const to = value
    if (from === to) return

    const startedAt = performance.now()
    const totalMs = duration * 1000

    const tick = (now: number) => {
      const elapsed = now - startedAt
      const t = Math.min(elapsed / totalMs, 1)
      const eased = easeOut(t)
      const current = from + (to - from) * eased
      setAnimated(current)
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        previousRef.current = to
        frameRef.current = null
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      previousRef.current = to
    }
  }, [value, duration, reduce])

  const display = reduce ? value : animated
  const text = format
    ? format(display)
    : display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })

  return (
    <span
      data-slot="ticker"
      className={cn("tabular-nums", className)}
      {...props}
    >
      {prefix}
      {text}
      {suffix}
    </span>
  )
}
