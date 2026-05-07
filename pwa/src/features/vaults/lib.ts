import type { VaultResponse as Vault } from "./hooks/use-vaults"
import type {
  VaultRowData,
  VaultSortKey,
  VaultSortState,
} from "./components/vault-row"

export type EnrichedRow = VaultRowData

export function buildRowData(vault: Vault): EnrichedRow {
  return {
    vault,
    nav: vault.nav ?? 0,
    delta24h: vault.delta24h ?? 0,
  }
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
