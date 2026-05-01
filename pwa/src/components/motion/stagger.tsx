import * as React from "react"
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion"

import { durations, outQuart } from "./easings"

type StaggerProps = Omit<
  HTMLMotionProps<"div">,
  "initial" | "animate" | "variants" | "children"
> & {
  /** Seconds between each child reveal. */
  gap?: number
  /** Initial offset in px for child slide-up. */
  offset?: number
  /** Per-child duration in seconds. */
  childDuration?: number
  children?: React.ReactNode
}

/**
 * Stagger container. Wrap children in <Stagger.Item> to participate.
 * Respects `prefers-reduced-motion` by zeroing offsets and stagger.
 */
function StaggerRoot({
  gap = durations.stagger,
  offset = 8,
  childDuration = durations.reveal,
  children,
  ...props
}: StaggerProps) {
  const reduce = useReducedMotion()
  const effectiveGap = reduce ? 0 : gap
  const effectiveOffset = reduce ? 0 : offset

  return (
    <motion.div
      data-stagger-root
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: effectiveGap,
          },
        },
      }}
      {...props}
    >
      <StaggerContext.Provider
        value={{ offset: effectiveOffset, duration: childDuration }}
      >
        {children}
      </StaggerContext.Provider>
    </motion.div>
  )
}

const StaggerContext = React.createContext<{ offset: number; duration: number }>({
  offset: 8,
  duration: durations.reveal,
})

type StaggerItemProps = Omit<HTMLMotionProps<"div">, "variants" | "children"> & {
  /** Override per-item offset. */
  offset?: number
  children?: React.ReactNode
}

function StaggerItem({ offset, children, ...props }: StaggerItemProps) {
  const ctx = React.useContext(StaggerContext)
  const y = offset ?? ctx.offset

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: ctx.duration, ease: outQuart },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const Stagger = Object.assign(StaggerRoot, { Item: StaggerItem })
