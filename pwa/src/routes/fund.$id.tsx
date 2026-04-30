import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { usePrivy } from "@privy-io/react-auth"
import { toast } from "sonner"
import { useVault } from "@/hooks/use-vault"
import { useVaultBalance } from "@/hooks/use-vault-balance"
import { useWallet } from "@/hooks/use-wallet"
import { investInVault, withdrawFromVault } from "@/lib/symmetry"
import { usePendingIntents } from "@/hooks/use-pending-intents"
import { getTokenMeta } from "@/lib/tokens"
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
  const { vault, loading, error } = useVault()
  const { ready, authenticated, login } = usePrivy()
  const { address, wallet } = useWallet()
  const { balance: vaultTokens, rawBalance } = useVaultBalance()
  const { intents } = usePendingIntents()
  const [sheetOpen, setSheetOpen] = useState(false)

  const vaultPrice = vault?.price ? parseFloat(vault.price) : 0
  const hasPosition = vaultTokens != null && vaultTokens > 0

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
        {/* Header */}
        <Column>
          <h1 className="text-2xl font-bold tracking-tight">{vault.name}</h1>
          <p className="text-sm text-muted-foreground">${vault.symbol}</p>
        </Column>

        {/* Price */}
        <Column className="gap-1">
          <p className="text-4xl font-bold tracking-tighter">
            ${vault.price ? parseFloat(vault.price).toFixed(4) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">per share</p>
        </Column>

        {/* Stats */}
        <Row className="gap-6">
          <Stat label="TVL" value={vault.tvl ? `$${parseFloat(vault.tvl).toFixed(2)}` : "—"} />
          <Stat label="Supply" value={vault.supplyOutstanding.toLocaleString()} />
          <Stat label="Deposit Fee" value={`${(vault.feeSettings.creatorDepositFeeBps / 100).toFixed(2)}%`} />
        </Row>

        {/* Pending Orders */}
        {authenticated && intents.length > 0 && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Open Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Column className="gap-3">
                  {intents.map((intent) => (
                    <Row key={intent.pubkey} className="items-center justify-between">
                      <Column className="gap-0">
                        <span className="text-sm font-medium capitalize">{intent.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {intent.tokens.map((t) => {
                            const meta = getTokenMeta(t.mint)
                            return `${(t.amount / 1e9).toFixed(4)} ${meta.symbol}`
                          }).join(", ")}
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

        {/* Your Position */}
        {authenticated && hasPosition && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Position</CardTitle>
              </CardHeader>
              <CardContent>
                <Column className="gap-3">
                  <Row className="items-center justify-between">
                    <span className="text-sm text-muted-foreground">Shares</span>
                    <span className="text-sm font-semibold">
                      {vaultTokens?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </Row>
                  <Separator />
                  <Row className="items-center justify-between">
                    <span className="text-sm text-muted-foreground">Value</span>
                    <span className="text-sm font-semibold">
                      ${(vaultTokens! * vaultPrice).toFixed(4)}
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
              {vault.composition
                .filter((asset) => asset.weight > 0)
                .map((asset, i, arr) => {
                  const meta = getTokenMeta(asset.mint)
                  return (
                    <Column key={asset.mint} className="gap-3">
                      <Row className="items-center justify-between">
                        <Row className="items-center">
                          <span className="text-sm font-medium">{meta.name}</span>
                          <Badge variant="secondary">{meta.symbol}</Badge>
                        </Row>
                        <span className="text-sm font-semibold">
                          {(asset.weight / 100).toFixed(0)}%
                        </span>
                      </Row>
                      {i < arr.length - 1 && <Separator />}
                    </Column>
                  )
                })}
            </Column>
          </CardContent>
        </Card>

        {/* Manage Position Button */}
        <Button
          size="lg"
          className="w-full text-base font-semibold"
          onClick={handleButtonClick}
        >
          {!ready
            ? "Loading..."
            : !authenticated
              ? "Connect Wallet"
              : "Manage Position"}
        </Button>
      </Column>

      {/* Bottom Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6">
          <SheetHeader>
            <SheetTitle>{vault.name}</SheetTitle>
            <SheetDescription>
              ${vault.symbol} · ${vaultPrice.toFixed(8)} per share
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="deposit" className="py-4">
            <TabsList className="w-full">
              <TabsTrigger value="deposit" className="flex-1">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw" className="flex-1">Withdraw</TabsTrigger>
            </TabsList>

            <TabsContent value="deposit">
              <DepositTab
                vault={vault}
                vaultPrice={vaultPrice}
                address={address}
                wallet={wallet}
                onDone={() => {
                  setSheetOpen(false)
                }}
              />
            </TabsContent>

            <TabsContent value="withdraw">
              <WithdrawTab
                vault={vault}
                vaultPrice={vaultPrice}
                vaultTokens={vaultTokens}
                rawBalance={rawBalance}
                address={address}
                wallet={wallet}
                onDone={() => {
                  setSheetOpen(false)
                }}
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  )
}

function DepositTab({
  vault,
  vaultPrice,
  address,
  wallet,
  onDone,
}: {
  vault: any
  vaultPrice: number
  address: string | null
  wallet: any
  onDone: () => void
}) {
  const [amount, setAmount] = useState("")
  const [processing, setProcessing] = useState(false)

  const numAmount = parseFloat(amount) || 0
  const effectivePrice = vaultPrice > 0 ? vaultPrice : 1.0
  const sharesEstimate = numAmount > 0 ? numAmount / effectivePrice : 0

  const handleDeposit = async () => {
    if (numAmount <= 0 || !address) return
    setProcessing(true)

    try {
      const lamports = Math.floor(numAmount * 1_000_000_000)
      await investInVault({
        buyerAddress: address,
        vaultMint: import.meta.env.VITE_VAULT_MINT,
        amountLamports: lamports,
        wallet,
      })
      toast.success("Deposit successful", {
        description: `Deposited ${numAmount} SOL into ${vault.name}`,
      })
      setAmount("")
      onDone()
    } catch (e: any) {
      console.error("Deposit error:", e)
      toast.error("Deposit failed", {
        description: e.message ?? "Something went wrong",
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Column className="gap-4 pt-4">
      <Column>
        <Label htmlFor="deposit-amount">Amount (SOL)</Label>
        <Input
          id="deposit-amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Column>

      <Row>
        {[0.1, 0.5, 1, 2].map((preset) => (
          <Button
            key={preset}
            variant="outline"
            size="sm"
            onClick={() => setAmount(String(preset))}
          >
            {preset} SOL
          </Button>
        ))}
      </Row>

      {numAmount > 0 && (
        <Card>
          <CardContent className="pt-4">
            <Column className="gap-2">
              <Row className="justify-between text-sm">
                <span className="text-muted-foreground">You pay</span>
                <span className="font-medium">{numAmount} SOL</span>
              </Row>
              <Separator />
              <Row className="justify-between text-sm">
                <span className="text-muted-foreground">You receive (est.)</span>
                <span className="font-medium">{sharesEstimate.toFixed(4)} {vault.symbol}</span>
              </Row>
            </Column>
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full text-base font-semibold"
        disabled={numAmount <= 0 || processing}
        onClick={handleDeposit}
      >
        {processing ? "Processing..." : "Confirm Deposit"}
      </Button>
    </Column>
  )
}

function WithdrawTab({
  vault,
  vaultPrice,
  vaultTokens,
  address,
  wallet,
  onDone,
}: {
  vault: any
  vaultPrice: number
  vaultTokens: number | null
  rawBalance: number | null
  address: string | null
  wallet: any
  onDone: () => void
}) {
  const [amount, setAmount] = useState("")
  const [processing, setProcessing] = useState(false)

  const numAmount = parseFloat(amount) || 0
  const solEstimate = numAmount * vaultPrice
  const hasBalance = vaultTokens != null && vaultTokens > 0
  const isValid = numAmount > 0 && vaultTokens != null && numAmount <= vaultTokens

  const handleWithdraw = async () => {
    if (!isValid || !address) return
    setProcessing(true)

    try {
      const rawAmount = Math.floor(numAmount * 1_000_000) // 6 decimals
      await withdrawFromVault({
        sellerAddress: address,
        vaultMint: import.meta.env.VITE_VAULT_MINT,
        amount: rawAmount,
        wallet,
      })
      toast.success("Withdrawal initiated", {
        description: `Withdrawing ${numAmount.toFixed(2)} ${vault.symbol}. Keeper will process shortly.`,
      })
      setAmount("")
      onDone()
    } catch (e: any) {
      console.error("Withdraw error:", e)
      toast.error("Withdrawal failed", {
        description: e.message ?? "Something went wrong",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (!hasBalance) {
    return (
      <Column className="gap-4 pt-4 items-center">
        <p className="text-sm text-muted-foreground">No position to withdraw from.</p>
      </Column>
    )
  }

  return (
    <Column className="gap-4 pt-4">
      <Column>
        <Label htmlFor="withdraw-amount">Shares ({vault.symbol})</Label>
        <Input
          id="withdraw-amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Available: {vaultTokens?.toLocaleString(undefined, { maximumFractionDigits: 2 })} {vault.symbol}
        </p>
      </Column>

      <Row>
        {[25, 50, 75, 100].map((pct) => (
          <Button
            key={pct}
            variant="outline"
            size="sm"
            onClick={() => {
              if (vaultTokens) setAmount(String(Math.floor(vaultTokens * pct / 100)))
            }}
          >
            {pct}%
          </Button>
        ))}
      </Row>

      {numAmount > 0 && (
        <Card>
          <CardContent className="pt-4">
            <Column className="gap-2">
              <Row className="justify-between text-sm">
                <span className="text-muted-foreground">You sell</span>
                <span className="font-medium">{numAmount.toLocaleString()} {vault.symbol}</span>
              </Row>
              <Separator />
              <Row className="justify-between text-sm">
                <span className="text-muted-foreground">You receive (est.)</span>
                <span className="font-medium">{solEstimate.toFixed(6)} SOL</span>
              </Row>
            </Column>
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        variant="destructive"
        className="w-full text-base font-semibold"
        disabled={!isValid || processing}
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
