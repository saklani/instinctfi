import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useVault, DepositTab } from "@/features/vaults"
import { usePendingOrders, OrderCard } from "@/features/orders"
import { usePositions } from "@/features/positions"
import { useWallet } from "@/hooks/use-wallet"
import { formatRaw, formatShares, formatPercent } from "@/lib/format"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Row } from "@/components/ui/row"
import { Column } from "@/components/ui/column"

export const Route = createFileRoute("/fund/$id")({
  component: FundDetailPage,
})

function FundDetailPage() {
  const { id } = Route.useParams()
  const { vault, loading, error } = useVault(id)
  const { ready, authenticated, login } = useWallet()
  const { orders: pendingOrders } = usePendingOrders()
  const { positions } = usePositions()
  const [sheetOpen, setSheetOpen] = useState(false)

  const position = positions.find((p) => p.vaultId === id)
  const myPendingOrders = pendingOrders.filter((o) => o.vaultId === id)

  const handleButtonClick = () => {
    if (!ready) return
    if (!authenticated) {
      login()
      return
    }
    setSheetOpen(true)
  }

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
        <Column>
          <h1>{vault.name}</h1>
          <p>{vault.description}</p>
        </Column>

        {/* Holdings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Holdings</CardTitle>
            <CardDescription>Current vault composition.</CardDescription>
          </CardHeader>
          <CardContent>
            <Column className="gap-3">
              {vault.compositions?.map((c, i, arr) => (
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

        {/* Position */}
        {authenticated && position && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Position</CardTitle>
            </CardHeader>
            <CardContent>
              <Column className="gap-3">
                <Row className="items-center justify-between">
                  <span className="text-sm text-muted-foreground">Invested</span>
                  <span className="text-sm font-semibold">
                    {formatRaw(position.amount)}
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
        )}

        {/* Open Orders */}
        {authenticated && myPendingOrders.length > 0 && (
          <Column className="gap-3">
            {myPendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </Column>
        )}

        <Button
          size="lg"
          className="w-full text-base font-semibold"
          onClick={handleButtonClick}
        >
          {!ready ? "Loading..." : !authenticated ? "Connect Wallet" : "Manage Position"}
        </Button>
      </Column>

      {/* Mobile: bottom sheet, Desktop: right side sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 md:hidden">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted-foreground/20" />
          <SheetHeader>
            <SheetTitle>{vault.name}</SheetTitle>
            <SheetDescription>Deposit USDC</SheetDescription>
          </SheetHeader>
          <DepositTab vaultId={vault.id} onDone={() => setSheetOpen(false)} />
        </SheetContent>
        <SheetContent side="right" showOverlay={false} className="hidden px-4 md:flex md:flex-col">
          <SheetHeader>
            <SheetTitle>{vault.name}</SheetTitle>
            <SheetDescription>Deposit USDC</SheetDescription>
          </SheetHeader>
          <DepositTab vaultId={vault.id} onDone={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}


