import { createFileRoute } from "@tanstack/react-router"

import { Column } from "@/components/ui/column"
import { Reveal } from "@/components/motion"
import { FeaturedSection } from "@/pages/discover/featured-section"
import { AllVaultsSection } from "@/pages/discover/all-vaults-section"

export const Route = createFileRoute("/")({
  component: DiscoverPage,
})

function DiscoverPage() {
  return (
    <Column className="gap-6 py-6 px-4">
      <Reveal>
        <h1 className="mb-6">
          Curated stock vaults{" "}
          <span className="text-muted-foreground">on Solana.</span>
        </h1>
      </Reveal>
      <FeaturedSection />
      <AllVaultsSection />
      <Footer />
    </Column>
  )
}

function Footer() {
  return (
    <footer className="flex flex-col border-t border-border text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span className="font-semibold tracking-tight text-foreground">
        instinct<span className="text-accent">.</span>
      </span>
      <nav className="flex flex-wrap items-center">
        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="rounded-sm hover:text-foreground outline-none focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-accent/30"
        >
          Github
        </a>
        <a
          href="https://x.com/"
          target="_blank"
          rel="noreferrer"
          className="rounded-sm hover:text-foreground outline-none focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-accent/30"
        >
          X
        </a>
      </nav>
    </footer>
  )
}
