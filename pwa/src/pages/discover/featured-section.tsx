import { Column } from "@/components/ui/column"
import {
  FeaturedCard,
  FeaturedCardSkeleton,
} from "@/features/vaults/components/featured-card"
import { useFeaturedVaults } from "@/features/vaults/hooks/use-enriched-vaults"


export function FeaturedSection() {
  const { rows, loading } = useFeaturedVaults()

  if (loading) {
    return (
      <Column className="lg:flex-row  gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <FeaturedCardSkeleton key={i} />
        ))}
      </Column>
    )
  }

  if (!rows.length) return null

  return (
    <Column className="lg:flex-row gap-6">
      {rows.map((row) => (
        <FeaturedCard key={row.vault.id} vault={row.vault} />
      ))}
    </Column>
  )
}
