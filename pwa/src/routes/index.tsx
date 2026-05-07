import { createFileRoute } from "@tanstack/react-router"

import { Reveal } from "@/components/motion"
import { FeaturedSection } from "@/pages/discover/featured-section"
import { AllVaultsSection } from "@/pages/discover/all-vaults-section"

export const Route = createFileRoute("/")({
  component: DiscoverPage,
})

function DiscoverPage() {
  return (
    <div className="flex flex-col gap-12 lg:gap-16">
      <Reveal>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-4xl">
          Curated stock baskets{" "}
          <span className="text-muted-foreground">on Solana.</span>
        </h1>
      </Reveal>
      <FeaturedSection />
      <AllVaultsSection />
      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-4 flex flex-col gap-4 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span className="font-semibold tracking-tight text-foreground">
        instinct<span className="text-accent">.</span>
      </span>
      <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="rounded-sm px-1 hover:text-foreground outline-none focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-accent/30"
        >
          Github
        </a>
        <a
          href="https://x.com/"
          target="_blank"
          rel="noreferrer"
          className="rounded-sm px-1 hover:text-foreground outline-none focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-accent/30"
        >
          X
        </a>
      </nav>
    </footer>
  )
}
