import { Column } from "@/components/ui/column"
import { Section } from "@/components/ui/section"
import {
  VaultRow,
  VaultTableHeader,
  VaultTableSkeleton,
} from "@/features/vaults/components/vault-row"
import { useDiscoverVaults } from "@/features/vaults/hooks/use-enriched-vaults"

export function AllVaultsSection() {
  const { rows, sort, onSort, loading, error } = useDiscoverVaults()

  return (
    <Section>
      <Column role="table" aria-label="All vaults">
        <VaultTableHeader sort={sort} onSortChange={onSort} />
        <Column role="rowgroup" className="divide-y divide-border">
          {loading && <VaultTableSkeleton />}
          {error && (
            <div className="text-center text-xs text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="text-center text-xs text-muted-foreground">
              No vaults yet. Check back soon.
            </div>
          )}
          {!loading && !error && rows.length > 0 &&
            rows.map((row) => <VaultRow key={row.vault.id} row={row} />)}
        </Column>
      </Column>
    </Section>
  )
}
