import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useVaults } from "@/features/vaults"
import type { Vault } from "@/features/vaults/api"
import { useJupiterPrices, type PriceMap } from "@/hooks/use-jupiter-prices"
import {
  FeaturedCard,
  FeaturedCardSkeleton,
  type FeaturedKind,
} from "@/features/vaults/components/featured-card"
import {
  VaultRow,
  VaultTableHeader,
  VaultTableSkeleton,
  type VaultRowData,
  type VaultSortKey,
  type VaultSortState,
} from "@/features/vaults/components/vault-row"

import { DiscoverHero } from "@/components/discover-hero"
import { Reveal } from "@/components/motion/reveal"
import { Stagger } from "@/components/motion/stagger"
import { durations } from "@/components/motion/easings"

export const Route = createFileRoute("/")({
  component: DiscoverPage,
})

function DiscoverPage() {
  const { vaults, loading, error } = useVaults()
  const [sort, setSort] = React.useState<VaultSortState>({
    key: "tvl",
    dir: "desc",
  })

  // Collect every unique mint across all vaults for a single Jupiter call
  const allMints = React.useMemo(() => {
    const set = new Set<string>()
    for (const v of vaults) {
      for (const c of v.compositions) set.add(c.stock.address)
    }
    return [...set]
  }, [vaults])

  const { prices, loading: pricesLoading } = useJupiterPrices(allMints)

  const enriched = React.useMemo<EnrichedRow[]>(
    () => vaults.map((v) => buildRowData(v, prices)),
    [vaults, prices],
  )

  const featured = React.useMemo(() => pickFeatured(enriched), [enriched])

  const sorted = React.useMemo(
    () => sortRows(enriched, sort),
    [enriched, sort],
  )

  const handleSort = (key: VaultSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: defaultDirFor(key) },
    )
  }

  const isLoading = loading || pricesLoading

  return (
    <div className="flex flex-col gap-12 lg:gap-16">
      <Reveal>
        <DiscoverHero />
      </Reveal>

      <FeaturedSection
        loading={isLoading}
        items={featured}
      />

      <section id="vaults" className="flex flex-col gap-4">
        <header className="flex items-baseline justify-between px-4">
          <h2 className="text-heading text-ink">All vaults</h2>
          <span className="font-mono text-mono-sm tabular text-ink-faint">
            {sorted.length} {sorted.length === 1 ? "vault" : "vaults"}
          </span>
        </header>

        <div
          role="table"
          aria-label="All vaults"
          className="flex flex-col"
        >
          <VaultTableHeader sort={sort} onSortChange={handleSort} />
          <div role="rowgroup" className="flex flex-col divide-y divide-hairline">
            {isLoading && <VaultTableSkeleton />}
            {error && <TableError message={error} />}
            {!isLoading && !error && sorted.length === 0 && <TableEmpty />}
            {!isLoading && !error && sorted.length > 0 && (
              <Stagger gap={0.03} offset={6}>
                {sorted.map((row) => (
                  <Stagger.Item key={row.vault.id}>
                    <VaultRow row={row} />
                  </Stagger.Item>
                ))}
              </Stagger>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FeaturedSection({
  loading,
  items,
}: {
  loading: boolean
  items: Array<{ kind: FeaturedKind; row: EnrichedRow }>
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <FeaturedCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!items.length) return null

  return (
    <Stagger
      gap={0.08}
      childDuration={durations.reveal}
      className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
    >
      {items.map(({ kind, row }) => (
        <Stagger.Item key={`${kind}-${row.vault.id}`} className="h-full">
          <FeaturedCard
            kind={kind}
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

function TableError({ message }: { message: string }) {
  return (
    <div className="px-4 py-12 text-center text-body-sm text-destructive">
      {message}
    </div>
  )
}

function TableEmpty() {
  return (
    <div className="px-4 py-16 text-center text-body-sm text-ink-muted">
      No vaults yet. Check back soon.
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-4 flex flex-col gap-4 border-t border-hairline px-4 py-6 text-body-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
      <span className="font-semibold tracking-tight text-ink">
        instinct<span className="text-accent">.</span>
      </span>
      <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="rounded-tag px-1 hover:text-ink outline-none focus-visible:text-ink focus-visible:ring-[3px] focus-visible:ring-accent/30"
        >
          Github
        </a>
        <a
          href="https://x.com/"
          target="_blank"
          rel="noreferrer"
          className="rounded-tag px-1 hover:text-ink outline-none focus-visible:text-ink focus-visible:ring-[3px] focus-visible:ring-accent/30"
        >
          X
        </a>
      </nav>
    </footer>
  )
}

// ---------- data helpers (Jupiter-powered) ----------

type EnrichedRow = VaultRowData & { spark: number[] }

function computeVaultNav(vault: Vault, prices: PriceMap) {
  let nav = 0
  let weightedDelta = 0
  let totalWeight = 0

  for (const c of vault.compositions) {
    const p = prices[c.stock.address]
    if (!p) continue
    const w = c.weightBps / 10_000
    nav += w * p.usdPrice
    weightedDelta += w * p.priceChange24h
    totalWeight += w
  }

  if (totalWeight > 0 && totalWeight < 0.99) {
    nav /= totalWeight
    weightedDelta /= totalWeight
  }

  return { nav, delta24h: weightedDelta, hasPrices: totalWeight > 0 }
}

function buildRowData(vault: Vault, prices: PriceMap): EnrichedRow {
  const { nav, delta24h } = computeVaultNav(vault, prices)

  // Build a flat spark array from current nav (placeholder until OHLCV lands)
  const spark = Array.from({ length: 28 }, () => nav || 100)

  return {
    vault,
    nav,
    delta24h,
    delta7d: 0,
    tvl: 0,
    holders: 0,
    inception: "",
    spark,
  }
}

function pickFeatured(rows: EnrichedRow[]) {
  if (!rows.length) return []
  const trending = rows[0]
  const topByDelta = [...rows].sort((a, b) => b.delta24h - a.delta24h)[0]
  const newest = [...rows].sort(
    (a, b) =>
      new Date(b.inception).getTime() - new Date(a.inception).getTime(),
  )[0]

  const used = new Set<string>()
  const result: Array<{ kind: FeaturedKind; row: EnrichedRow }> = []

  function pushIfNew(kind: FeaturedKind, row?: EnrichedRow) {
    if (!row) return
    if (used.has(row.vault.id)) {
      const fallback = rows.find((r) => !used.has(r.vault.id))
      if (!fallback) return
      used.add(fallback.vault.id)
      result.push({ kind, row: fallback })
      return
    }
    used.add(row.vault.id)
    result.push({ kind, row })
  }

  pushIfNew("trending", trending)
  pushIfNew("top-24h", topByDelta)
  pushIfNew("newest", newest)
  return result
}

function defaultDirFor(key: VaultSortKey): "asc" | "desc" {
  return key === "name" || key === "inception" ? "asc" : "desc"
}

function sortRows(rows: EnrichedRow[], sort: VaultSortState): EnrichedRow[] {
  const factor = sort.dir === "asc" ? 1 : -1
  const copy = [...rows]
  copy.sort((a, b) => {
    switch (sort.key) {
      case "name":
        return a.vault.name.localeCompare(b.vault.name) * factor
      case "nav":
        return (a.nav - b.nav) * factor
      case "delta24h":
        return (a.delta24h - b.delta24h) * factor
      case "delta7d":
        return (a.delta7d - b.delta7d) * factor
      case "tvl":
        return (a.tvl - b.tvl) * factor
      case "holders":
        return (a.holders - b.holders) * factor
      case "inception":
        return (
          (new Date(a.inception).getTime() - new Date(b.inception).getTime()) *
          factor
        )
      default:
        return 0
    }
  })
  return copy
}
