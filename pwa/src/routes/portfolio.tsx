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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
})

function PortfolioPage() {
  const { ready, authenticated, login } = useWallet()
  const { positions, loading: posLoading } = usePositions()
  const { orders: pendingOrders } = usePendingOrders()

  if (!ready) {
    return (
      <Column className="gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
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

  const totalCostBasis = positions.reduce((sum, p) => sum + Number(p.costBasisUsdc), 0)

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
            <span className="text-lg font-semibold">${totalCostBasis.toFixed(2)}</span>
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
                      ${order.amountUsdc} USDC
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
                      ${Number(position.costBasisUsdc).toFixed(2)}
                    </span>
                  </Row>
                  <Separator />
                  <Row className="items-center justify-between">
                    <span className="text-sm text-muted-foreground">Shares</span>
                    <span className="text-sm font-semibold">
                      {Number(position.shares).toLocaleString()}
                    </span>
                  </Row>
                </Column>
              </CardContent>
            </Card>
          ))}
        </Column>
      ) : !posLoading ? (
        <Card>
          <CardContent className="py-12">
            <Column className="items-center gap-4">
              <p className="text-sm text-muted-foreground text-center">
                No positions yet. Invest in a vault to get started.
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
