import type { VaultResponse as Vault } from "./hooks/use-vaults"
import type {
  VaultRowData,
  VaultSortKey,
  VaultSortState,
} from "./components/vault-row"

export type EnrichedRow = VaultRowData

/** Vaults that are live and clickable. Others render as "coming soon". Order is preserved when sorting. */
const LIVE_VAULT_IDS = [
  "0844e06c-db1b-4803-92ad-63d0c04c41b5", // Not Insider Trading
  "24b7ef64-15d7-490a-aeb4-b2a05de050f9", // Bald Founder Index
] as const

const LIVE_VAULT_ID_SET = new Set<string>(LIVE_VAULT_IDS)

export function isLiveVault(vaultId: string): boolean {
  return LIVE_VAULT_ID_SET.has(vaultId)
}

function livePriority(vaultId: string): number {
  const idx = (LIVE_VAULT_IDS as readonly string[]).indexOf(vaultId)
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
}

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
    // Live vaults always come first, in their declared order.
    const aLive = isLiveVault(a.vault.id)
    const bLive = isLiveVault(b.vault.id)
    if (aLive !== bLive) return aLive ? -1 : 1
    if (aLive && bLive) return livePriority(a.vault.id) - livePriority(b.vault.id)

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
