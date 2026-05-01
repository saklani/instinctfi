import * as React from "react"
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion"

import { durations, outQuart } from "./easings"

type RevealProps = Omit<
  HTMLMotionProps<"div">,
  "initial" | "animate" | "transition" | "children"
> & {
  /** Pixel offset to translate from. Default 8px. */
  offset?: number
  /** Override duration in seconds. */
  duration?: number
  /** Optional delay in seconds. */
  delay?: number
  /** When false, render static. Useful for conditional reveals. */
  active?: boolean
  as?: keyof typeof motion
  children?: React.ReactNode
}

/**
 * Fade + slide-up reveal. Defaults to 280ms out-quart, 8px offset.
 * Honors `prefers-reduced-motion` by collapsing to opacity-only.
 */
export function Reveal({
  offset = 8,
  duration = durations.reveal,
  delay = 0,
  active = true,
  children,
  ...props
}: RevealProps) {
  const reduce = useReducedMotion()

  if (!active) {
    return <div {...(props as React.ComponentProps<"div">)}>{children}</div>
  }

  const y = reduce ? 0 : offset

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay,
        ease: outQuart,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
