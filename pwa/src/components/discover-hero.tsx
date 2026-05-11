import { cn } from "@/lib/utils"

type DiscoverHeroProps = {
  className?: string
}

export function DiscoverHero({ className }: DiscoverHeroProps) {
  return (
    <section
      data-slot="discover-hero"
      className={cn(
        "flex flex-col gap-4 px-4 pt-2 lg:pt-6",
        className,
      )}
    >
      <span className="text-pill text-ink-faint">Discover</span>
      <h1 className="max-w-3xl text-display-md font-semibold leading-[1.05] tracking-tight text-ink lg:text-display-lg">
        Curated stock baskets
        <br />
        <span className="text-ink-muted">on Solana.</span>
      </h1>
    </section>
  )
}
