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
    allTime: vault.allTime ?? null,
  }
}

export function sortRows(rows: EnrichedRow[], sort: VaultSortState): EnrichedRow[] {
  const factor = sort.dir === "asc" ? 1 : -1
  const copy = [...rows]
  copy.sort((a, b) => {
    switch (sort.key) {
      case "name":
        return a.vault.name.localeCompare(b.vault.name) * factor
      case "allTime": {
        // Nulls always sink — independent of sort direction.
        const av = a.allTime
        const bv = b.allTime
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        return (av - bv) * factor
      }
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
