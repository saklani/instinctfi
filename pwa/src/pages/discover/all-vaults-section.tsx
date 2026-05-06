import {
  VaultRow,
  VaultTableHeader,
  VaultTableSkeleton,
} from "@/features/vaults/components/vault-row"
import { useDiscoverVaults } from "@/features/vaults/hooks/use-enriched-vaults"
import { Section, SectionHeader } from "@/components/ui/section"
import { Stagger } from "@/components/motion"

export function AllVaultsSection() {
  const { rows, sort, onSort, loading, error } = useDiscoverVaults()

  return (
    <Section>
      <SectionHeader
        title="All vaults"
        meta={`${rows.length} ${rows.length === 1 ? "vault" : "vaults"}`}
      />
      <div role="table" aria-label="All vaults" className="flex flex-col">
        <VaultTableHeader sort={sort} onSortChange={onSort} />
        <div role="rowgroup" className="flex flex-col divide-y divide-border">
          {loading && <VaultTableSkeleton />}
          {error && (
            <div className="py-12 text-center text-xs text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No vaults yet. Check back soon.
            </div>
          )}
          {!loading && !error && rows.length > 0 && (
            <Stagger gap={0.03} offset={6}>
              {rows.map((row) => (
                <Stagger.Item key={row.vault.id}>
                  <VaultRow row={row} />
                </Stagger.Item>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </Section>
  )
}
