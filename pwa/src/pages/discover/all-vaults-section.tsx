import { VaultTable } from "@/features/vaults/components/vault-row"
import { useDiscoverVaults } from "@/features/vaults/hooks/use-enriched-vaults"

export function AllVaultsSection() {
  const { rows, sort, onSort, loading, error } = useDiscoverVaults()
  return (
    <VaultTable
      rows={rows}
      sort={sort}
      onSort={onSort}
      loading={loading}
      error={error}
    />
  )
}
