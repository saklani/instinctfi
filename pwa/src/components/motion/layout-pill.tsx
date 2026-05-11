import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import { springs } from "./easings"

/**
 * Background capsule that animates between siblings via Framer Motion `layoutId`.
 * Render as the active child's first node — its bounds drive the morph target.
 *
 * Reduced motion → static fade.
 */
export function LayoutPill({
  layoutId,
  className,
  ...props
}: React.ComponentProps<typeof motion.span> & { layoutId: string }) {
  const reduce = useReducedMotion()

  return (
    <motion.span
      aria-hidden
      layoutId={layoutId}
      transition={reduce ? { duration: 0 } : springs.pill}
      className={cn(
        "absolute inset-0 -z-10 rounded-pill bg-surface shadow-card",
        className
      )}
      {...props}
    />
  )
}
