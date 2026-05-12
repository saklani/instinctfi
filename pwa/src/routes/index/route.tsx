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
      <FeaturedCards />
      <AllVaults />
    </Column>
  )
}
