import { motion, useReducedMotion, type SVGMotionProps } from "framer-motion"

import { durations, outQuart } from "./easings"

type PathDrawProps = Omit<SVGMotionProps<SVGPathElement>, "initial" | "animate" | "transition"> & {
  duration?: number
  delay?: number
}

/**
 * SVG path that strokes itself in via path-length animation.
 * Reduced motion → instant fully-drawn path.
 */
export function PathDraw({
  duration = durations.pathDraw,
  delay = 0,
  ...props
}: PathDrawProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <motion.path {...props} />
  }

  return (
    <motion.path
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: { duration, delay, ease: outQuart },
        opacity: { duration: 0.1, delay },
      }}
      {...props}
    />
  )
}
