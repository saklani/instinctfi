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
          <CardTitle className="text-lg">{vault.name}</CardTitle>
          <CardDescription>{vault.description}</CardDescription>
        </CardHeader>

        <CardContent>
          <Column className="gap-4">
            <p className="text-xs font-medium text-muted-foreground">Composition</p>
            <Row className="flex-wrap">
              {vault.compositions?.map((c) => (
                <Badge key={c.stock.id} variant="secondary">
                  {c.stock.ticker} {(c.weightBps / 100).toFixed(0)}%
                </Badge>
              ))}
            </Row>
          </Column>
        </CardContent>
      </Card>
    </Link>
  )
}
