import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { springs } from "@/components/motion/easings"

type StickyCtaProps = {
  /** Click handler (typically opens a Sheet). */
  onClick?: () => void
  /** Render a chevron-down to signal it expands a sheet. */
  expandable?: boolean
  disabled?: boolean
  className?: string
  /** Override aria-label. Defaults to the rendered label text. */
  ariaLabel?: string
  children: React.ReactNode
}

/**
 * Mobile-only fixed bottom CTA. Spring-in on first mount.
 * On scroll-down, recedes slightly (shadow + 4px translate). On scroll-up, restores.
 * Inset above the bottom tab bar + safe-area.
 */
export function StickyCta({
  onClick,
  expandable = false,
  disabled = false,
  className,
  ariaLabel,
  children,
}: StickyCtaProps) {
  const reduce = useReducedMotion()
  const [recede, setRecede] = React.useState(false)
  const lastYRef = React.useRef(0)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    lastYRef.current = window.scrollY
    const onScroll = () => {
      const next = window.scrollY
      const delta = next - lastYRef.current
      if (Math.abs(delta) < 8) return
      setRecede(delta > 0 && next > 80)
      lastYRef.current = next
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.div
      data-slot="sticky-cta"
      data-recede={recede ? "true" : undefined}
      initial={reduce ? { opacity: 0 } : { y: 96, opacity: 0 }}
      animate={{
        y: reduce ? 0 : recede ? 4 : 0,
        opacity: 1,
      }}
      transition={reduce ? { duration: 0.16 } : springs.cta}
      className={cn(
        "fixed left-4 right-4 z-40 md:hidden",
        "bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+16px)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "group/sticky flex h-14 w-full items-center justify-center gap-2 rounded-pill",
          "bg-cta text-cta-ink select-none",
          "shadow-cta transition-shadow duration-200",
          "data-[recede=true]:shadow-cta-active",
          "active:translate-y-px active:duration-[80ms]",
          "outline-none focus-visible:ring-[4px] focus-visible:ring-accent/30",
          "disabled:opacity-60",
        )}
        data-recede={recede ? "true" : undefined}
      >
        <span className="font-mono text-mono-md font-medium tabular uppercase tracking-[0.04em]">
          {children}
        </span>
        {expandable && (
          <ChevronDown
            aria-hidden
            className="size-4 transition-transform duration-200 group-aria-expanded/sticky:rotate-180"
          />
        )}
      </button>
    </motion.div>
  )
}
