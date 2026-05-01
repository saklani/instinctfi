import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useWallet } from "@/hooks/use-wallet"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
})

function PortfolioPage() {
  const { ready, authenticated, login } = useWallet()

  if (!ready) {
    return (
      <Column className="gap-6">
        <Column>
          <h1>Portfolio</h1>
          <Skeleton className="h-4 w-48" />
        </Column>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </Column>
    )
  }

  if (!authenticated) {
    return (
      <Column className="gap-6">
        <Column>
          <h1>Portfolio</h1>
          <p>Sign in to view your holdings.</p>
          <Button className="mt-2" onClick={() => login()}>Sign In</Button>
        </Column>
      </Column>
    )
  }

  return (
    <Column className="gap-8">
      <Column>
        <h1>Portfolio</h1>
        <p>Your holdings and orders.</p>
      </Column>

      <HoldingsSection />
      <OrdersSection />
    </Column>
  )
}

function HoldingsSection() {
  const { positions, loading } = usePositions()
  const { orders } = usePendingOrders()

  const totalDeposited = positions.reduce((sum, p) => sum + Number(p.amount) / 1e6, 0)
  const totalProcessing = orders
    .filter((o) => o.type === "deposit")
    .reduce((sum, o) => sum + Number(o.amount) / 1e6, 0)

  if (loading) {
    return (
      <Column>
        <h2>Holdings</h2>
        <Card>
          <CardContent className="mt-0">
            <Column className="gap-3">
              <Row className="items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
              </Row>
              <Separator />
              <Row className="items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
              </Row>
            </Column>
          </CardContent>
        </Card>
      </Column>
    )
  }

  return (
    <Column>
      <h2>Holdings</h2>
      <Card>
        <CardContent className="mt-0">
            <Row className="items-center justify-between">
              <span className="text-sm text-muted-foreground">Invested</span>
              <span className="text-lg font-semibold">{formatUsd(totalDeposited)}</span>
            </Row>
            {totalProcessing > 0 && (
              <>
                <Separator />
                <Row className="items-center justify-between">
                  <span className="text-sm text-muted-foreground">Processing</span>
                  <span className="text-sm font-semibold text-muted-foreground">{formatUsd(totalProcessing)}</span>
                </Row>
              </>
            )}
        </CardContent>
      </Card>
    </Column>
  )
}

function OrdersSection() {
  const { orders, loading } = useOrders()

  if (loading) {
    return (
      <Column>
        <h2>Orders</h2>
        <Skeleton className="h-24 w-full" />
      </Column>
    )
  }

  if (orders.length === 0) {
    return (
      <Column>
        <h2>Orders</h2>
        <p>No orders yet.</p>
      </Column>
    )
  }

  return (
    <Column>
      <h2>Orders</h2>
      <Column className="gap-2">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </Column>
    </Column>
  )
}

// Imports used by section components
import { OrderCard, useOrders, usePendingOrders } from "@/features/orders"
import { usePositions } from "@/features/positions"
import { formatUsd } from "@/lib/format"
