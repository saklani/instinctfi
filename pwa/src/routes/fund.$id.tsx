import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { useVault } from "@/hooks/use-vault"
import { usePendingOrders } from "@/hooks/use-orders"
import { usePositions } from "@/hooks/use-positions"
import { useWallet } from "@/hooks/use-wallet"
import { useServerWallet } from "@/components/api-provider"
import { createDeposit, createWithdrawal } from "@/lib/api"
import { getUsdcBalance } from "@/lib/transfer"
import { formatUsd, formatUsdcRaw, formatShares, formatPercent } from "@/lib/format"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Row } from "@/components/ui/row"
import { Column } from "@/components/ui/column"
import { FormError } from "@/components/ui/form-error"
import { LoadingButton } from "@/components/ui/loading-button"

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
        <Skeleton className="h-10 w-full rounded-4xl" />
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
                          {formatUsdcRaw(order.amount)}
                        </span>
                      </Column>
                      <Badge variant="secondary">Processing</Badge>
                    </Row>
                  ))}
                </Column>
              </CardContent>
            </Card>
        )}

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
        )}

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
                      {formatPercent(c.weightBps)}
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
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted-foreground/20" />
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

const depositSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (v) => parseFloat(v) > 0,
    "Amount must be greater than 0",
  ),
})

type DepositFormData = z.infer<typeof depositSchema>

function DepositTab({ vaultId, onDone }: { vaultId: string; onDone: () => void }) {
  const queryClient = useQueryClient()
  const serverWallet = useServerWallet()
  const { wallet, walletAddress, signAndSendTransaction } = useWallet()
  const [isPending, setIsPending] = useState(false)

  const { data: balance } = useQuery({
    queryKey: ["usdc-balance", walletAddress],
    queryFn: () => getUsdcBalance(walletAddress!),
    enabled: !!walletAddress,
    refetchInterval: 30_000,
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
  })

  const onSubmit = async (data: DepositFormData) => {
    if (!serverWallet || !wallet || !walletAddress) return
    setIsPending(true)

    try {
      const rawAmount = BigInt(Math.floor(parseFloat(data.amount) * 1e6))

      const { buildUsdcTransfer } = await import("@/lib/transfer")
      const { transaction } = await buildUsdcTransfer({
        from: walletAddress,
        to: serverWallet,
        amount: rawAmount,
      })

      const { signature } = await signAndSendTransaction({
        transaction: new Uint8Array(transaction),
        wallet,
      })

      const { getBase58Codec } = await import("@solana/codecs-strings")
      const sigString = typeof signature === "string"
        ? signature
        : getBase58Codec().decode(signature)

      await createDeposit({
        vaultId,
        amount: rawAmount.toString(),
        signature: sigString,
      })

      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      await queryClient.invalidateQueries({ queryKey: ["positions"] })
      await queryClient.invalidateQueries({ queryKey: ["usdc-balance"] })

      toast.success("Deposit submitted", {
        description: "Your deposit will be processed at next market open.",
      })
      reset()
      onDone()
    } catch (e: any) {
      console.error("Deposit error:", e)
      toast.error("Deposit failed", { description: e.message })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Column className="gap-4 pt-4">
        <Column>
          <Row className="items-center justify-between">
            <Label htmlFor="deposit-amount">Amount (USDC)</Label>
            {balance !== undefined && (
              <Button
                type="button"
                variant="link"
                size="xs"
                className="text-muted-foreground"
                onClick={() => setValue("amount", String(balance), { shouldValidate: true })}
              >
                Balance: {formatUsd(balance)}
              </Button>
            )}
          </Row>
          <Input
            id="deposit-amount"
            type="number"
            step="any"
            placeholder="0.00"
            className="h-12 text-lg"
            disabled={isPending}
            aria-invalid={!!errors.amount}
            {...register("amount")}
          />
          {errors.amount && <FormError message={errors.amount.message} />}
        </Column>

        <Row className="gap-2">
          {[10, 25, 50, 100].map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={isPending}
              onClick={() => setValue("amount", String(preset), { shouldValidate: true })}
            >
              ${preset}
            </Button>
          ))}
        </Row>

        <LoadingButton
          type="submit"
          size="lg"
          className="w-full text-base font-semibold"
          isLoading={isPending}
          disabled={!serverWallet}
        >
          Deposit
        </LoadingButton>
      </Column>
    </form>
  )
}

const withdrawSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (v) => parseFloat(v) > 0,
    "Amount must be greater than 0",
  ),
})

type WithdrawFormData = z.infer<typeof withdrawSchema>

function WithdrawTab({ vaultId, onDone }: { vaultId: string; onDone: () => void }) {
  const queryClient = useQueryClient()
  const { positions } = usePositions()
  const [isPending, setIsPending] = useState(false)

  const position = positions.find((p) => p.vaultId === vaultId)
  const balanceUsdc = position ? Number(position.amount) / 1e6 : 0

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawSchema),
  })

  const onSubmit = async (data: WithdrawFormData) => {
    setIsPending(true)

    try {
      const rawAmount = String(Math.floor(parseFloat(data.amount) * 1e6))

      await createWithdrawal({
        vaultId,
        amount: rawAmount,
      })

      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      await queryClient.invalidateQueries({ queryKey: ["positions"] })

      toast.success("Withdrawal submitted", {
        description: "Will be processed at next market open.",
      })
      reset()
      onDone()
    } catch (e: any) {
      toast.error("Withdrawal failed", { description: e.message })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Column className="gap-4 pt-4">
        <Column>
          <Row className="items-center justify-between">
            <Label htmlFor="withdraw-amount">Amount (USDC)</Label>
            {balanceUsdc > 0 && (
              <Button
                type="button"
                variant="link"
                size="xs"
                className="text-muted-foreground"
                onClick={() => setValue("amount", String(balanceUsdc), { shouldValidate: true })}
              >
                Balance: {formatUsd(balanceUsdc)}
              </Button>
            )}
          </Row>
          <Input
            id="withdraw-amount"
            type="number"
            step="any"
            placeholder="0.00"
            className="h-12 text-lg"
            disabled={isPending}
            aria-invalid={!!errors.amount}
            {...register("amount")}
          />
          {errors.amount && <FormError message={errors.amount.message} />}
        </Column>

        <LoadingButton
          type="submit"
          size="lg"
          variant="destructive"
          className="w-full text-base font-semibold"
          isLoading={isPending}
        >
          Withdraw
        </LoadingButton>
      </Column>
    </form>
  )
}
