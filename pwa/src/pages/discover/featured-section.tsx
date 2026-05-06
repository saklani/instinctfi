import {
  FeaturedCard,
  FeaturedCardSkeleton,
} from "@/features/vaults/components/featured-card"
import { useFeaturedVaults } from "@/features/vaults/hooks/use-enriched-vaults"
import { Stagger, durations } from "@/components/motion"

const GRID_CLASS =
  "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"

export function FeaturedSection() {
  const { rows, loading } = useFeaturedVaults(3)

  if (loading) {
    return (
      <div className={GRID_CLASS}>
        {Array.from({ length: 3 }).map((_, i) => (
          <FeaturedCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!rows.length) return null

  return (
    <Stagger gap={0.08} childDuration={durations.reveal} className={GRID_CLASS}>
      {rows.map((row) => (
        <Stagger.Item key={row.vault.id} className="h-full">
          <FeaturedCard
            vault={row.vault}
            nav={row.nav}
            delta={row.delta24h}
            spark={row.spark}
          />
        </Stagger.Item>
      ))}
    </Stagger>
  )
}
