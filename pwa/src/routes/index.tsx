import { createFileRoute } from "@tanstack/react-router"

import { Column } from "@/components/ui/column"
import { FeaturedSection } from "@/pages/discover/featured-section"
import { AllVaultsSection } from "@/pages/discover/all-vaults-section"

export const Route = createFileRoute("/")({
  component: DiscoverPage,
})

function DiscoverPage() {
  return (
    <Column className="gap-12 pt-12 pb-24">
      <FeaturedSection />
      <AllVaultsSection />
    </Column>
  )
}
