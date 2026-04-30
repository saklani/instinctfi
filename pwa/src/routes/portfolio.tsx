import { createFileRoute, Link } from "@tanstack/react-router"
import { useWallet } from "@/hooks/use-wallet"
import { usePositions } from "@/hooks/use-positions"
import { usePendingOrders } from "@/hooks/use-orders"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatUsd, formatUsdcRaw, formatShares } from "@/lib/format"

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
})

function PortfolioPage() {
  const { ready, authenticated, login } = useWallet()
  const { positions, loading: posLoading } = usePositions()
  const { orders: pendingOrders } = usePendingOrders()

  if (!ready || (authenticated && posLoading)) {
    return (
      <Column className="gap-6">
        <Column>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
          <Skeleton className="h-4 w-48" />
        </Column>
        <Card>
          <CardContent className="pt-6">
            <Row className="items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20" />
            </Row>
          </CardContent>
        </Card>
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Column className="gap-3">
                <Row className="items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </Row>
                <Separator />
                <Row className="items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </Row>
              </Column>
            </CardContent>
          </Card>
        ))}
      </Column>
    )
  }

  if (!authenticated) {
    return (
      <Column className="gap-6">
        <Column>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Sign in to view your holdings.</p>
          <Button className="mt-2" onClick={() => login()}>Sign In</Button>
        </Column>
      </Column>
    )
  }

  const totalCostBasis = positions.reduce((sum, p) => sum + Number(p.amount) / 1e6, 0)

  return (
    <Column className="gap-6">
      <Column>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Your holdings and orders.</p>
      </Column>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <Row className="items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Invested</span>
            <span className="text-lg font-semibold">{formatUsd(totalCostBasis)}</span>
          </Row>
        </CardContent>
      </Card>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Column className="gap-3">
              {pendingOrders.map((order) => (
                <Row key={order.id} className="items-center justify-between">
                  <Column className="gap-0">
                    <span className="text-sm font-medium capitalize">{order.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatUsdcRaw(order.amount)}
                    </span>
                  </Column>
                  <Badge variant="secondary">
                    {order.status === "pending" ? "Awaiting USDC" : "Processing"}
                  </Badge>
                </Row>
              ))}
            </Column>
          </CardContent>
        </Card>
      )}

      {/* Positions */}
      {positions.length > 0 ? (
        <Column className="gap-3">
          {positions.map((position) => (
            <Card key={position.id}>
              <CardContent className="pt-6">
                <Column className="gap-3">
                  <Row className="items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cost Basis</span>
                    <span className="text-sm font-semibold">
                      {formatUsdcRaw(position.amount)}
                    </span>
                  </Row>
                  <Separator />
                  <Row className="items-center justify-between">
                    <span className="text-sm text-muted-foreground">Shares</span>
                    <span className="text-sm font-semibold">
                      {formatShares(position.shares)}
                    </span>
                  </Row>
                </Column>
              </CardContent>
            </Card>
          ))}
        </Column>
      ) : !posLoading ? (
        <Card>
          <CardContent className="py-16">
            <Column className="items-center gap-4">
              <TrendingUp className="size-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground text-center">
                You're all set up. Discover a vault to make your first investment.
              </p>
              <Link to="/">
                <Button>Explore Vaults</Button>
              </Link>
            </Column>
          </CardContent>
        </Card>
      ) : null}
    </Column>
  )
}
