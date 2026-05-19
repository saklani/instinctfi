import { createFileRoute } from "@tanstack/react-router"

import { Column } from "@/components/ui/column"
import { FeaturedCards } from "./-featured-cards"
import { AllVaults } from "./-all-vaults"

export const Route = createFileRoute("/")({
  component: DiscoverPage,
})

function DiscoverPage() {
  return (
    <Column className="gap-12 pt-12 pb-24">
      <Column>
        <Column className="gap-2">
          <p className="eyebrow">DISCOVER</p>
          <h1>Pick a Vault</h1>
        </Column>
        <FeaturedCards />
      </Column>
      <AllVaults />
    </Column>
  )
}
