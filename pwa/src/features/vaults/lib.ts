import type { Vault } from "./api"
import type { PriceMap } from "@/hooks/use-jupiter-prices"
import type {
  VaultRowData,
  VaultSortKey,
  VaultSortState,
} from "./components/vault-row"

export type EnrichedRow = VaultRowData

export function computeVaultNav(vault: Vault, prices: PriceMap) {
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

  return { nav, delta24h: weightedDelta }
}

export function buildRowData(vault: Vault, prices: PriceMap): EnrichedRow {
  const { nav, delta24h } = computeVaultNav(vault, prices)
  return { vault, nav, delta24h }
}

export function sortRows(rows: EnrichedRow[], sort: VaultSortState): EnrichedRow[] {
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
      default:
        return 0
    }
  })
  return copy
}

export function nextSortDir(
  prev: VaultSortState,
  key: VaultSortKey,
): VaultSortState {
  if (prev.key === key) {
    return { key, dir: prev.dir === "asc" ? "desc" : "asc" }
  }
  return { key, dir: key === "name" ? "asc" : "desc" }
}
