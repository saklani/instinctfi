import * as React from "react"
import { Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { PathDraw } from "@/components/motion/path-draw"
import { outQuart } from "@/components/motion/easings"
import { cn } from "@/lib/utils"

type OnboardingWelcomeProps = {
  className?: string
  onDismiss?: () => void
  title?: string
  subtitle?: string
  ctaLabel?: string
}

const WORD_GAP = 0.04

export function OnboardingWelcome({
  className,
  onDismiss,
  title = "Welcome to instinct.",
  subtitle = "Curated baskets, one click.",
  ctaLabel = "Browse vaults",
}: OnboardingWelcomeProps) {
  const titleWords = title.trim().split(/\s+/).length
  const subtitleStart = titleWords * WORD_GAP + 0.08

  return (
    <section
      data-slot="onboarding-welcome"
      className={cn(
        "relative mx-auto flex min-h-[calc(100vh-14rem)] max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16 text-center",
        "md:min-h-[calc(100vh-10rem)] md:gap-10 md:py-24",
        className,
      )}
    >
      <h1 className="max-w-3xl text-display-lg font-semibold tracking-tight text-ink md:text-display-xl">
        <WordCascade text={title} startDelay={0} />
      </h1>

      <p className="max-w-xl text-heading font-medium text-ink-muted md:text-display-md md:tracking-tight">
        <WordCascade text={subtitle} startDelay={subtitleStart} />
      </p>

      <GuideArrow />

      <Button
        asChild
        variant="primary-accent"
        size="lg"
        onClick={() => onDismiss?.()}
      >
        <Link to="/" className="group/onboarding-cta">
          {ctaLabel}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-200 group-hover/onboarding-cta:translate-x-0.5"
          />
        </Link>
      </Button>
    </section>
  )
}

function WordCascade({
  text,
  startDelay = 0,
  gap = WORD_GAP,
  duration = 0.32,
}: {
  text: string
  startDelay?: number
  gap?: number
  duration?: number
}) {
  const reduce = useReducedMotion()
  const words = React.useMemo(() => text.trim().split(/\s+/), [text])

  if (reduce) {
    return <span>{text}</span>
  }

  return (
    <span>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration,
              delay: startDelay + i * gap,
              ease: outQuart,
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && " "}
        </React.Fragment>
      ))}
    </span>
  )
}

function GuideArrow() {
  // Cobalt arrow drawing downward toward the CTA.
  // Total: 600ms (line 400ms + chevron 200ms, sequential).
  return (
    <svg
      viewBox="0 0 80 80"
      aria-hidden
      className="text-accent"
      style={{ width: 56, height: 80, overflow: "visible" }}
      fill="none"
    >
      <PathDraw
        d="M40 6 C 36 28, 36 40, 40 60"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        duration={0.4}
      />
      <PathDraw
        d="M30 50 L40 60 L50 50"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        duration={0.2}
        delay={0.4}
      />
    </svg>
  )
}
