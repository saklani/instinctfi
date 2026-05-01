import { createFileRoute } from "@tanstack/react-router"
import { useVault, MobileDepositButton, DesktopDepositButton } from "@/features/vaults"
import { usePendingOrders, OrderCard } from "@/features/orders"
import { PositionCard } from "@/features/positions"
import { useWallet } from "@/hooks/use-wallet"
import { formatPercent } from "@/lib/format"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Row } from "@/components/ui/row"
import { Column } from "@/components/ui/column"

export const Route = createFileRoute("/fund/$id")({
  component: FundDetailPage,
})

function FundDetailPage() {
  const { id } = Route.useParams()
  const { vault, loading, error } = useVault(id)
  const { authenticated } = useWallet()
  const { orders: pendingOrders } = usePendingOrders()

  const myPendingOrders = pendingOrders.filter((o) => o.vaultId === id)

  if (loading) {
    return (
      <Column className="gap-6">
        <Column>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </Column>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Column className="gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Row key={i} className="items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </Row>
              ))}
            </Column>
          </CardContent>
        </Card>
        <Skeleton className="h-10 w-full" />
      </Column>
    )
  }

  if (error || !vault) {
    return (
      <Column className="py-12 items-center">
        <p className="text-destructive">{error ?? "Vault not found"}</p>
      </Column>
    )
  }

  return (
    <>
      <Column className="gap-6">
        <Row className="items-start justify-between">
          <Column>
            <h1>{vault.name}</h1>
            <p>{vault.description}</p>
          </Column>
          <DesktopDepositButton vaultId={vault.id} vaultName={vault.name} />
        </Row>

        <PositionCard vaultId={id} />

        {/* Holdings */}
        <Card>
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
            <CardDescription>Current vault composition.</CardDescription>
          </CardHeader>
          <CardContent>
            <Column className="gap-3">
              {vault.compositions?.toSorted((a, b) => b.weightBps - a.weightBps).map((c, i, arr) => (
                <Column key={c.stock.id} className="gap-3">
                  <Row className="items-center justify-between">
                    <Row className="items-center">
                      <img src={c.stock.imageUrl} alt={c.stock.ticker} className="size-6 rounded-full" />
                      <span className="text-sm font-medium">{c.stock.name}</span>
                      <Badge variant="secondary">{c.stock.ticker}</Badge>
                    </Row>
                    <span className="text-sm font-semibold">
                      {formatPercent(c.weightBps)}
                    </span>
                  </Row>
                  {i < arr.length - 1 && <Separator />}
                </Column>
              ))}
            </Column>
          </CardContent>
        </Card>

        {/* Open Orders */}
        {authenticated && myPendingOrders.length > 0 && (
          <Column className="gap-3">
            {myPendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </Column>
        )}
      </Column>

      <MobileDepositButton vaultId={vault.id} vaultName={vault.name} />
    </>
  )
}
