import * as React from "react"
import { Link } from "@tanstack/react-router"
import { motion, useReducedMotion } from "framer-motion"

import { InstallButton } from "@/components/install-button"
import { cn } from "@/lib/utils"

const desktopLinks = [
  { to: "/", label: "Discover" },
  { to: "/portfolio", label: "Portfolio" },
] as const

function Wordmark() {
  return (
    <Link
      to="/"
      aria-label="instinct, home"
      className="inline-flex items-center outline-none focus-visible:ring-[4px] focus-visible:ring-accent/30 rounded-pill px-1"
    >
      <img src="/logo-black.png" alt="Instinct" className="h-6" />
    </Link>
  )
}

type TopNavProps = {
  /** Force scrolled state — used by Storybook to demo the hairline border. */
  forceScrolled?: boolean
  /** Override the right slot — used by Storybook to render install button states. */
  rightSlot?: React.ReactNode
}

export function TopNav({ forceScrolled, rightSlot }: TopNavProps) {
  const [liveScrolled, setLiveScrolled] = React.useState(
    () => typeof window !== "undefined" && window.scrollY > 32
  )
  const reduce = useReducedMotion()
  const scrolled = forceScrolled ?? liveScrolled

  React.useEffect(() => {
    if (forceScrolled !== undefined) return
    const onScroll = () => setLiveScrolled(window.scrollY > 32)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [forceScrolled])

  return (
    <header
      data-scrolled={scrolled}
      className="sticky top-0 z-40 bg-canvas/85 backdrop-blur-md"
    >
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 md:px-6">
        {/* Left: wordmark + desktop nav links */}
        <div className="flex items-center gap-6">
          <Wordmark />
          <nav className="hidden items-center gap-1 md:flex">
            {desktopLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-body-sm text-ink-muted transition-colors duration-150",
                  "hover:text-ink",
                  "[&.active]:text-ink [&.active]:font-medium",
                  "outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: install button */}
        <div className="ml-auto flex items-center gap-2">
          {rightSlot ?? <InstallButton />}
        </div>

        {/* Hairline border that fades in past 32px scroll */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-hairline"
          initial={false}
          animate={{ opacity: scrolled ? 1 : 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
        />
      </div>
    </header>
  )
}
