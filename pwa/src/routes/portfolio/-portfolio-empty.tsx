import { Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import { PathDraw } from "@/components/motion"

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
    <Column
      data-slot="portfolio-empty"
      className={cn("items-center text-center", className)}
    >
      <Illustration />
      <Column>
        <h2 className="max-w-md">{title}</h2>
        <p className="max-w-md">{subtitle}</p>
      </Column>
      <Button asChild variant="default" size="lg">
        <Link to="/" className="group/empty-cta">
          {ctaLabel}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-200 group-hover/empty-cta:translate-x-0.5"
          />
        </Link>
      </Button>
    </Column>
  )
}

function Illustration() {
  // Editorial placeholder: a Cobalt arc + ascending stroke. Path draws on mount.
  return (
    <Row
      aria-hidden
      className="relative size-32 items-center justify-center rounded-full bg-muted/60"
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full border border-dashed border-border"
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
    </Row>
  )
}
