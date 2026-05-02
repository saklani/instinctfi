import { Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PathDraw } from "@/components/motion/path-draw"

type PortfolioEmptyProps = {
  className?: string
  /** Headline; defaults to "No holdings yet." */
  title?: string
  /** Subline; defaults to a short editorial line. */
  subtitle?: string
  /** CTA label. Defaults to "Discover vaults". */
  ctaLabel?: string
}

/**
 * Empty-state for `/portfolio` when the connected wallet holds nothing.
 * Editorial illustration placeholder + display-md headline + Cobalt-arrow CTA.
 */
export function PortfolioEmpty({
  className,
  title = "No holdings yet.",
  subtitle = "Curated baskets are one click away. Browse and put capital to work.",
  ctaLabel = "Discover vaults",
}: PortfolioEmptyProps) {
  return (
    <section
      data-slot="portfolio-empty"
      className={cn(
        "flex flex-col items-center gap-6 px-4 py-12 text-center md:py-20",
        className,
      )}
    >
      <Illustration />
      <div className="flex flex-col gap-3">
        <h2 className="max-w-md text-display-md font-semibold tracking-tight text-ink">
          {title}
        </h2>
        <p className="max-w-md text-body text-ink-muted">{subtitle}</p>
      </div>
      <Button asChild variant="primary-accent" size="lg">
        <Link to="/" className="group/empty-cta">
          {ctaLabel}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-200 group-hover/empty-cta:translate-x-0.5"
          />
        </Link>
      </Button>
    </section>
  )
}

function Illustration() {
  // Editorial placeholder: a Cobalt arc + ascending stroke. Path draws on mount.
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex size-32 items-center justify-center rounded-full",
        "bg-surface-muted/60",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-3 rounded-full border border-dashed border-hairline"
      />
      <svg
        viewBox="0 0 80 80"
        fill="none"
        className="size-16 text-accent"
      >
        <PathDraw
          d="M14 56 L30 40 L44 50 L66 22"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <PathDraw
          d="M58 22 L66 22 L66 30"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          delay={0.18}
        />
      </svg>
    </div>
  )
}
