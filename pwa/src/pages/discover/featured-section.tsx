import * as React from "react"

import {
  FeaturedCard,
  FeaturedCardSkeleton,
} from "@/features/vaults/components/featured-card"
import { useFeaturedVaults } from "@/features/vaults/hooks/use-enriched-vaults"

const GRID_CLASS =
  "grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3"

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
    <React.Suspense
      fallback={
        <div className={GRID_CLASS}>
          {Array.from({ length: rows.length }).map((_, i) => (
            <FeaturedCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <div className={GRID_CLASS}>
        {rows.map((row) => (
          <FeaturedCard key={row.vault.id} vaultId={row.vault.id} />
        ))}
      </div>
    </React.Suspense>
  )
}
