import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type DiscoverHeroProps = {
  /** Anchor target for the primary CTA. Default `#vaults`. */
  ctaHref?: string
  className?: string
}

export function DiscoverHero({
  ctaHref = "#vaults",
  className,
}: DiscoverHeroProps) {
  return (
    <section
      data-slot="discover-hero"
      className={cn(
        "flex flex-col gap-6 px-4 pt-2 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:pt-6",
        className,
      )}
    >
      <div className="flex max-w-3xl flex-col gap-4">
        <span className="text-pill text-ink-faint">Discover</span>
        <h1 className="text-display-md font-semibold leading-[1.05] tracking-tight text-ink lg:text-display-lg">
          Curated stock baskets
          <br />
          <span className="text-ink-muted">on Solana.</span>
        </h1>
      </div>
      <Button
        variant="primary-accent"
        size="lg"
        asChild
        className="self-start"
      >
        <a href={ctaHref}>
          Browse vaults
          <ArrowRight aria-hidden />
        </a>
      </Button>
    </section>
  )
}
