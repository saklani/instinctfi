import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Motion no-op shims. The redesign branch wrapped UI in framer-motion
 * components. We ship without framer-motion to keep the bundle small;
 * these shims keep the call sites working as plain DOM fragments.
 */

type RevealProps = React.ComponentProps<"div"> & {
  as?: keyof React.JSX.IntrinsicElements
}

export function Reveal({ as = "div", className, children, ...props }: RevealProps) {
  const Comp = as as React.ElementType
  return (
    <Comp
      className={cn("animate-in fade-in-0 duration-300", className)}
      {...props}
    >
      {children}
    </Comp>
  )
}

type StaggerProps = React.ComponentProps<"div"> & {
  /** Ignored in the no-op shim. */
  gap?: number
  /** Ignored in the no-op shim. */
  offset?: number
  /** Ignored in the no-op shim. */
  childDuration?: number
  /** Ignored in the no-op shim. */
  as?: keyof React.JSX.IntrinsicElements
}

function StaggerRoot({
  className,
  children,
  as = "div",
  ...props
}: StaggerProps) {
  const Comp = as as React.ElementType
  // Strip motion-only props so they don't end up on the DOM
  const { gap: _gap, offset: _offset, childDuration: _cd, ...rest } = props
  void _gap
  void _offset
  void _cd
  return (
    <Comp className={className} {...rest}>
      {children}
    </Comp>
  )
}

function StaggerItem({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export const Stagger = Object.assign(StaggerRoot, { Item: StaggerItem })

type TickerProps = React.ComponentProps<"span"> & {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
}

/** Number "ticker" — no animation, just formatted output. */
export function Ticker({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  className,
  ...props
}: TickerProps) {
  const formatted = Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value)
    : "—"
  return (
    <span className={cn("tabular-nums", className)} {...props}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

/** SVG path stroke draw — no-op (renders a static <path>). */
export function PathDraw(
  props: React.SVGProps<SVGPathElement> & { delay?: number; duration?: number },
) {
  const { delay: _delay, duration: _duration, ...rest } = props
  void _delay
  void _duration
  return <path {...rest} />
}

export const durations = {
  reveal: 0.3,
  chartLine: 0.7,
  chartArea: 0.4,
  route: 0.2,
  checkmark: 0.4,
}

export const outQuart = [0.25, 1, 0.5, 1] as const

export const springs = {
  cta: { type: "spring" as const, stiffness: 300, damping: 30 },
}
