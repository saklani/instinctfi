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
const FEATURED_VAULT_NAMES = [
  "NOT INSIDER TRADING",
  "Bald Founder Index",
  "REVERSE CHAMATH",
] as const

export function useFeaturedVaults(limit = FEATURED_VAULT_NAMES.length) {
  const { rows, loading } = useEnrichedVaults()
  const featured = React.useMemo(() => {
    const byName = new Map(rows.map((r) => [r.vault.name, r]))
    return FEATURED_VAULT_NAMES.map((name) => byName.get(name))
      .filter((r): r is NonNullable<typeof r> => r != null)
      .slice(0, limit)
  }, [rows, limit])
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
