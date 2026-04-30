import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
import { useVault } from "@/hooks/use-vault"
import { usePendingOrders } from "@/hooks/use-orders"
import { usePositions } from "@/hooks/use-positions"
import { useWallet } from "@/hooks/use-wallet"
import { useServerWallet } from "@/components/api-provider"
import { createOrder } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
      <Column className="py-12 items-center">
        <p className="text-sm text-muted-foreground">Loading vault...</p>
      </Column>
    )
  }

  if (error || !vault) {
    return (
      <Column className="py-12 items-center">
        <p className="text-sm text-destructive">{error ?? "Vault not found"}</p>
      </Column>
    )
  }

  return (
    <>
      <Column className="gap-6">
        <Column>
          <h1 className="text-2xl font-bold tracking-tight">{vault.name}</h1>
          <p className="text-sm text-muted-foreground">{vault.description}</p>
        </Column>

        {/* Pending Orders */}
        {authenticated && myPendingOrders.length > 0 && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Open Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Column className="gap-3">
                  {myPendingOrders.map((order) => (
                    <Row key={order.id} className="items-center justify-between">
                      <Column className="gap-0">
                        <span className="text-sm font-medium capitalize">{order.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {order.amount} USDC
                        </span>
                      </Column>
                      <Badge variant="secondary">Processing</Badge>
                    </Row>
                  ))}
                </Column>
              </CardContent>
            </Card>
          </>
        )}

        {/* Position */}
        {authenticated && position && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Position</CardTitle>
              </CardHeader>
              <CardContent>
                <Column className="gap-3">
                  <Row className="items-center justify-between">
                    <span className="text-sm text-muted-foreground">Invested</span>
                    <span className="text-sm font-semibold">
                      {Number(position.amount).toFixed(2)} USDC
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
          </>
        )}

        <Separator />

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
                      <span className="text-sm font-medium">{c.stock.name}</span>
                      <Badge variant="secondary">{c.stock.ticker}</Badge>
                    </Row>
                    <span className="text-sm font-semibold">
                      {(c.weightBps / 100).toFixed(0)}%
                    </span>
                  </Row>
                  {i < arr.length - 1 && <Separator />}
                </Column>
              ))}
            </Column>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full text-base font-semibold"
          onClick={handleButtonClick}
        >
          {!ready ? "Loading..." : !authenticated ? "Connect Wallet" : "Manage Position"}
        </Button>
      </Column>

      {/* Bottom Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6">
          <SheetHeader>
            <SheetTitle>{vault.name}</SheetTitle>
            <SheetDescription>Deposit or withdraw USDC</SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="deposit" className="py-4">
            <TabsList className="w-full">
              <TabsTrigger value="deposit" className="flex-1">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw" className="flex-1">Withdraw</TabsTrigger>
            </TabsList>

            <TabsContent value="deposit">
              <DepositTab vaultId={vault.id} onDone={() => setSheetOpen(false)} />
            </TabsContent>

            <TabsContent value="withdraw">
              <WithdrawTab vaultId={vault.id} onDone={() => setSheetOpen(false)} />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  )
}

function DepositTab({ vaultId, onDone }: { vaultId: string; onDone: () => void }) {
  const serverWallet = useServerWallet()
  const [amount, setAmount] = useState("")
  const [processing, setProcessing] = useState(false)

  const numAmount = parseFloat(amount) || 0

  const handleDeposit = async () => {
    if (numAmount <= 0 || !serverWallet) return
    setProcessing(true)

    try {
      // TODO: build USDC transfer tx from user wallet to serverWallet
      // Sign with Privy embedded wallet
      // Get tx signature
      const signature = "TODO_TRANSFER_SIGNATURE"

      // Convert to 8 decimal raw amount
      const rawAmount = String(Math.floor(numAmount * 1e8))

      await createOrder({
        vaultId,
        type: "deposit",
        amount: rawAmount,
        signature,
      })

      toast.success("Deposit submitted", {
        description: "Your deposit will be processed at next market open.",
      })
      setAmount("")
      onDone()
    } catch (e: any) {
      toast.error("Deposit failed", { description: e.message })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Column className="gap-4 pt-4">
      <Column>
        <Label htmlFor="deposit-amount">Amount (USDC)</Label>
        <Input
          id="deposit-amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Column>

      <Row>
        {[10, 25, 50, 100].map((preset) => (
          <Button
            key={preset}
            variant="outline"
            size="sm"
            onClick={() => setAmount(String(preset))}
          >
            ${preset}
          </Button>
        ))}
      </Row>

      <Button
        size="lg"
        className="w-full text-base font-semibold"
        disabled={numAmount <= 0 || processing || !serverWallet}
        onClick={handleDeposit}
      >
        {processing ? "Processing..." : "Deposit"}
      </Button>
    </Column>
  )
}

function WithdrawTab({ vaultId, onDone }: { vaultId: string; onDone: () => void }) {
  const [amount, setAmount] = useState("")
  const [processing, setProcessing] = useState(false)
  const numAmount = parseFloat(amount) || 0

  const handleWithdraw = async () => {
    if (numAmount <= 0) return
    setProcessing(true)

    try {
      // For withdrawals, no transfer needed — just create the order
      // The server will sell vault tokens and send USDC back
      const rawAmount = String(Math.floor(numAmount * 1e8))

      await createOrder({
        vaultId,
        type: "withdraw",
        amount: rawAmount,
        signature: "", // no transfer for withdrawals
      })

      toast.success("Withdrawal submitted", {
        description: "Will be processed at next market open.",
      })
      setAmount("")
      onDone()
    } catch (e: any) {
      toast.error("Withdrawal failed", { description: e.message })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Column className="gap-4 pt-4">
      <Column>
        <Label htmlFor="withdraw-amount">Amount (USDC)</Label>
        <Input
          id="withdraw-amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Column>

      <Button
        size="lg"
        variant="destructive"
        className="w-full text-base font-semibold"
        disabled={numAmount <= 0 || processing}
        onClick={handleWithdraw}
      >
        {processing ? "Processing..." : "Withdraw"}
      </Button>
    </Column>
  )
}
