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
import { Skeleton } from "@/components/ui/skeleton"
import { Row } from "@/components/ui/row"
import { Column } from "@/components/ui/column"
import { formatPercent } from "@/lib/format"
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

      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Column className="gap-4">
                <Skeleton className="h-3 w-20" />
                <Row className="flex-wrap">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-16 rounded-4xl" />
                  ))}
                </Row>
              </Column>
            </CardContent>
          </Card>
        ))}

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
      <Card className="transition-all duration-150 hover:bg-accent/50 hover:shadow-md active:scale-[0.98] cursor-pointer">
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
                  {c.stock.ticker} {formatPercent(c.weightBps)}
                </Badge>
              ))}
            </Row>
          </Column>
        </CardContent>
      </Card>
    </Link>
  )
}
