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
import { useVault } from "@/hooks/use-vault"
import { getTokenMeta } from "@/lib/tokens"
import { createFileRoute, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: DiscoverPage,
})

function DiscoverPage() {
  const { vault, loading, error } = useVault()

  return (
    <Column className="gap-6">
      <Column>
        <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
        <p className="text-sm text-muted-foreground">
          Invest in tokenized US equities through diversified index funds.
        </p>
      </Column>

      {loading && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading vault data from Solana...
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

      {vault && <VaultCard vault={vault} />}
    </Column>
  )
}

function VaultCard({ vault }: { vault: NonNullable<ReturnType<typeof useVault>["vault"]> }) {
  return (
    <Link to="/fund/$id" params={{ id: import.meta.env.VITE_VAULT_ADDRESS }}>
      <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
        <CardHeader>
          <Row className="items-start justify-between">
            <Column>
              <CardTitle className="text-lg">{vault.name}</CardTitle>
              <CardDescription>${vault.symbol}</CardDescription>
            </Column>
            <Column className="items-end">
              {vault.price && (
                <p className="text-lg font-semibold">
                  ${parseFloat(vault.price).toFixed(4)}
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
              <Stat label="Supply" value={vault.supplyOutstanding.toLocaleString()} />
              <Stat
                label="Deposit Fee"
                value={`${(vault.feeSettings.creatorDepositFeeBps / 100).toFixed(2)}%`}
              />
            </Row>

            <Separator />

            <Column>
              <p className="text-xs font-medium text-muted-foreground">
                Composition
              </p>
              <Row className="flex-wrap">
                {vault.composition.map((asset) => {
                  const meta = getTokenMeta(asset.mint)
                  return (
                    <Badge key={asset.mint} variant="secondary">
                      {meta.symbol} {(asset.weight / 100).toFixed(0)}%
                    </Badge>
                  )
                })}
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
