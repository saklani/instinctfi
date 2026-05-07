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

/** Top-N vaults by 24h delta (descending). */
export function useFeaturedVaults(limit = 3) {
  const { rows, loading } = useEnrichedVaults()
  const featured = React.useMemo(
    () => [...rows].sort((a, b) => b.delta24h - a.delta24h).slice(0, limit),
    [rows, limit],
  )
  return { rows: featured, loading }
}

/** Sortable view for the All Vaults table — owns its own sort state. */
export function useDiscoverVaults() {
  const { rows, loading, error } = useEnrichedVaults()
  const [sort, setSort] = React.useState<VaultSortState>({
    key: "nav",
    dir: "desc",
  })

  const sorted = React.useMemo(() => sortRows(rows, sort), [rows, sort])

  const onSort = React.useCallback((key: VaultSortKey) => {
    setSort((prev) => nextSortDir(prev, key))
  }, [])

  return { rows: sorted, sort, onSort, loading, error }
}
