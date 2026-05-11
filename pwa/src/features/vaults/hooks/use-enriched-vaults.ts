import * as React from "react"

import { useVaults } from "./use-vaults"
import { buildRowData, nextSortDir, sortRows, type EnrichedRow } from "../lib"
import type {
  VaultSortKey,
  VaultSortState,
} from "../components/vault-row"

/** Base hook — vaults from API, mapped to enriched rows. NAV/delta are server-computed. */
export function useEnrichedVaults() {
  const { vaults, loading, error } = useVaults()

  const rows = React.useMemo<EnrichedRow[]>(
    () => vaults.map((v) => buildRowData(v)),
    [vaults],
  )

  return {
    rows,
    loading,
    error,
  }
}

/** Hand-picked featured vaults, rendered in this order. */
const FEATURED_VAULT_IDS = [
  "0844e06c-db1b-4803-92ad-63d0c04c41b5", // Not Insider Trading
  "24b7ef64-15d7-490a-aeb4-b2a05de050f9", // Bald Founder Index
  "429cbfe8-04a3-4cff-b860-32e68c5aff61", // Reverse Chamath
] as const

export function useFeaturedVaults() {
  const { rows, loading } = useEnrichedVaults()
  const featured = React.useMemo(() => {
    const byId = new Map(rows.map((r) => [r.vault.id, r]))
    return FEATURED_VAULT_IDS.map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => r != null)
      .slice(0,  FEATURED_VAULT_IDS.length)
  }, [rows, FEATURED_VAULT_IDS.length])
  return { rows: featured, loading }
}

/** Sortable view for the All Vaults table — owns its own sort state. */
export function useDiscoverVaults() {
  const { rows, loading, error } = useEnrichedVaults()
  const [sort, setSort] = React.useState<VaultSortState>({
    key: "allTime",
    dir: "desc",
  })

  const sorted = React.useMemo(() => sortRows(rows, sort), [rows, sort])

  const onSort = React.useCallback((key: VaultSortKey) => {
    setSort((prev) => nextSortDir(prev, key))
  }, [])

  return { rows: sorted, sort, onSort, loading, error }
}
