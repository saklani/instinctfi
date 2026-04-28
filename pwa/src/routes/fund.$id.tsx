import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { usePrivy } from "@privy-io/react-auth"
import { toast } from "sonner"
import { useVault } from "@/hooks/use-vault"
import { useWallet } from "@/hooks/use-wallet"
import { investInVault } from "@/lib/symmetry"
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
  const [sheetOpen, setSheetOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [investing, setInvesting] = useState(false)

  const numAmount = parseFloat(amount) || 0
  const vaultPrice = vault?.price ? parseFloat(vault.price) : 0
  const effectivePrice = vaultPrice > 0 ? vaultPrice : 1.0
  const sharesEstimate = numAmount > 0 ? numAmount / effectivePrice : 0

  const handleFabClick = () => {
    if (!ready) return
    if (!authenticated) {
      login()
      return
    }
    setSheetOpen(true)
  }

  const handleInvest = async () => {
    if (numAmount <= 0 || !address) return
    setInvesting(true)

    try {
      const lamports = Math.floor(numAmount * 1_000_000_000)

      await investInVault({
        buyerAddress: address,
        vaultMint: import.meta.env.VITE_VAULT_MINT,
        amountLamports: lamports,
        wallet: wallet,
      })

      toast.success("Investment successful", {
        description: `Deposited ${numAmount} SOL into ${vault?.name}`,
      })
      setSheetOpen(false)
      setAmount("")
    } catch (e: any) {
      console.error("Invest error:", e)
      toast.error("Investment failed", {
        description: e.message ?? "Something went wrong",
      })
    } finally {
      setInvesting(false)
    }
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
      <Column className="gap-6 pb-24">
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

        <Separator />

        {/* Holdings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Holdings</CardTitle>
            <CardDescription>Current vault composition and target weights.</CardDescription>
          </CardHeader>
          <CardContent>
            <Column className="gap-3">
              {vault.composition.map((asset, i) => {
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
                    {i < vault.composition.length - 1 && <Separator />}
                  </Column>
                )
              })}
            </Column>
          </CardContent>
        </Card>
      </Column>

      {/* FAB */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
        <Button
          size="lg"
          className="w-full text-base font-semibold shadow-lg"
          onClick={handleFabClick}
        >
          {!ready
            ? "Loading..."
            : !authenticated
              ? "Connect Wallet"
              : "Start Investing"}
        </Button>
      </div>

      {/* Bottom Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6">
          <SheetHeader>
            <SheetTitle>Invest in {vault.name}</SheetTitle>
            <SheetDescription>
              ${vault.symbol} · ${vault.price ? parseFloat(vault.price).toFixed(4) : "—"} per share
            </SheetDescription>
          </SheetHeader>

          <Column className="gap-6 py-6">
            {/* Amount input */}
            <Column>
              <Label htmlFor="amount">Amount (SOL)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </Column>

            {/* Quick amounts */}
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

            {/* Summary */}
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

            {/* Confirm */}
            <Button
              size="lg"
              className="w-full text-base font-semibold"
              disabled={numAmount <= 0 || investing}
              onClick={handleInvest}
            >
              {investing ? "Processing..." : "Confirm Investment"}
            </Button>
          </Column>
        </SheetContent>
      </Sheet>
    </>
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
