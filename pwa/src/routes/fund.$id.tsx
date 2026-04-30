import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
import { useVault } from "@/hooks/use-vault"
import { usePendingOrders } from "@/hooks/use-orders"
import { usePositions } from "@/hooks/use-positions"
import { useWallet } from "@/hooks/use-wallet"
import { createOrder, confirmOrder } from "@/lib/api"
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

  const vaultPrice = vault?.price ? parseFloat(vault.price) : 0
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

        <Column className="gap-1">
          <p className="text-4xl font-bold tracking-tighter">
            ${vaultPrice ? vaultPrice.toFixed(6) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">per share</p>
        </Column>

        <Row className="gap-6">
          <Stat label="TVL" value={vault.tvl ? `$${parseFloat(vault.tvl).toFixed(2)}` : "—"} />
          <Stat label="Supply" value={vault.supply?.toLocaleString() ?? "0"} />
          <Stat label="Withdraw Fee" value={`${(vault.withdrawFeeBps / 100).toFixed(2)}%`} />
        </Row>

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
                          ${order.amount} USDC
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
                    <span className="text-sm text-muted-foreground">Cost Basis</span>
                    <span className="text-sm font-semibold">
                      ${Number(position.amount).toFixed(2)}
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
            <CardDescription>Current vault composition and target weights.</CardDescription>
          </CardHeader>
          <CardContent>
            <Column className="gap-3">
              {vault.onChainComposition
                ?.filter((a) => a.weight > 0)
                .map((asset, i, arr) => (
                  <Column key={asset.mint} className="gap-3">
                    <Row className="items-center justify-between">
                      <span className="text-sm font-medium">{asset.mint.slice(0, 8)}...</span>
                      <span className="text-sm font-semibold">
                        {(asset.weight / 100).toFixed(0)}%
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
            <SheetDescription>
              ${vaultPrice.toFixed(8)} per share
            </SheetDescription>
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
  const [amount, setAmount] = useState("")
  const [depositAddress, setDepositAddress] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [step, setStep] = useState<"amount" | "send" | "confirming">("amount")

  const numAmount = parseFloat(amount) || 0

  const handleCreateOrder = async () => {
    if (numAmount <= 0) return

    try {
      const order = await createOrder({
        vaultId,
        type: "deposit",
        amount: amount,
      })
      setDepositAddress(order.depositAddress)
      setOrderId(order.id)
      setStep("send")
    } catch (e: any) {
      toast.error("Failed to create order", { description: e.message })
    }
  }

  const handleConfirm = async () => {
    if (!orderId) return
    setStep("confirming")

    try {
      await confirmOrder(orderId)
      toast.success("Order submitted", {
        description: "Your deposit will be processed at next market open.",
      })
      onDone()
    } catch (e: any) {
      toast.error("Failed to confirm", { description: e.message })
      setStep("send")
    }
  }

  if (step === "send" && depositAddress) {
    return (
      <Column className="gap-4 pt-4">
        <Column>
          <Label>Send ${amount} USDC to:</Label>
          <button
            className="mt-2 rounded-md bg-muted p-3 font-mono text-xs break-all text-left"
            onClick={() => {
              navigator.clipboard.writeText(depositAddress)
              toast.success("Copied!")
            }}
          >
            {depositAddress}
          </button>
          <p className="text-xs text-muted-foreground mt-1">Tap to copy</p>
        </Column>

        <Button
          size="lg"
          className="w-full text-base font-semibold"
          disabled={step === "confirming"}
          onClick={handleConfirm}
        >
          {step === "confirming" ? "Confirming..." : "I've Sent the USDC"}
        </Button>
      </Column>
    )
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
        disabled={numAmount <= 0}
        onClick={handleCreateOrder}
      >
        Continue
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
      await createOrder({
        vaultId,
        type: "withdraw",
        amount: amount,
      })
      toast.success("Withdrawal submitted", {
        description: "Will be processed at next market open.",
      })
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
        {processing ? "Processing..." : "Confirm Withdrawal"}
      </Button>
    </Column>
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
