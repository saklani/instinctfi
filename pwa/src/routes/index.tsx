import { createFileRoute, Link } from "@tanstack/react-router"
import { useVaults } from "@/hooks/use-vault"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Row } from "@/components/ui/row"
import { Column } from "@/components/ui/column"
import type { Vault } from "@/lib/api"

export const Route = createFileRoute("/")({
  component: DiscoverPage,
})

function DiscoverPage() {
  const { vaults, loading, error } = useVaults()

  return (
    <Column className="gap-6">
      <Column>
        <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
        <p className="text-sm text-muted-foreground">
          Your cheatcode to Internet Capital Markets.
        </p>
      </Column>

      {loading && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading vaults...
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {vaults.map((vault) => (
        <VaultCard key={vault.id} vault={vault} />
      ))}
    </Column>
  )
}

function VaultCard({ vault }: { vault: Vault }) {
  return (
    <Link to="/fund/$id" params={{ id: vault.id }}>
      <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
        <CardHeader>
          <Row className="items-start justify-between">
            <Column>
              <CardTitle className="text-lg">{vault.name}</CardTitle>
              <CardDescription>{vault.description}</CardDescription>
            </Column>
            <Column className="items-end">
              {vault.price && (
                <p className="text-lg font-semibold">
                  ${parseFloat(vault.price).toFixed(6)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">per share</p>
            </Column>
          </Row>
        </CardHeader>

        <CardContent>
          <Column className="gap-4">
            <Row className="gap-6">
              <Stat label="TVL" value={vault.tvl ? `$${parseFloat(vault.tvl).toFixed(2)}` : "—"} />
              <Stat label="Supply" value={vault.supply?.toLocaleString() ?? "0"} />
            </Row>

            <Separator />

            <Column>
              <p className="text-xs font-medium text-muted-foreground">Composition</p>
              <Row className="flex-wrap">
                {vault.onChainComposition
                  ?.filter((a) => a.weight > 0)
                  .map((asset) => (
                    <Badge key={asset.mint} variant="secondary">
                      {asset.mint.slice(0, 6)} {(asset.weight / 100).toFixed(0)}%
                    </Badge>
                  ))}
              </Row>
            </Column>
          </Column>
        </CardContent>
      </Card>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Column className="gap-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </Column>
  )
}
