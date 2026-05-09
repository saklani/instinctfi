import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Clock } from "lucide-react"

import { useWallet } from "@/hooks/use-wallet"
import { useHoldings } from "@/features/holdings"
import { request } from "@/lib/api"
import { getUsdcBalance } from "@/lib/transfer"
import { isMarketOpen, marketStatusText } from "@/lib/market-hours"
import { Button } from "@/components/ui/button"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MonoNumber } from "@/components/ui/mono-number"
import { LoadingButton } from "@/components/ui/loading-button"
import { FormError } from "@/components/ui/form-error"
import { Skeleton } from "@/components/ui/skeleton"
import type { Vault } from "@/db/schema"

const amountSchema = z.object({
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
})

type AmountFormData = z.infer<typeof amountSchema>

type DepositPanelTab = "deposit" | "withdraw"

type DepositPanelProps = {
  vault: Pick<Vault, "id" | "name" | "address">
  className?: string
  /** Called after a successful submit. Use to close a Sheet etc. */
  onDone?: () => void
  defaultTab?: DepositPanelTab
}

export function DepositPanel({
  vault,
  className,
  onDone,
  defaultTab = "deposit",
}: DepositPanelProps) {
  const isLive = vault.address != null

  if (!isLive) {
    return (
      <Column data-slot="deposit-panel" className={className}>
        <NotDeployed />
      </Column>
    )
  }

  return (
    <Tabs
      data-slot="deposit-panel"
      defaultValue={defaultTab}
      className={className}
    >
      <TabsList>
        <TabsTrigger value="deposit">Deposit</TabsTrigger>
        <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
      </TabsList>

      <TabsContent value="deposit">
        <DepositTab vault={vault} onDone={onDone} />
      </TabsContent>
      <TabsContent value="withdraw">
        <WithdrawTab vault={vault} onDone={onDone} />
      </TabsContent>
    </Tabs>
  )
}

function NotDeployed() {
  return (
    <Column className="rounded-sm border border-dashed border-border text-xs text-muted-foreground">
      <Row className="items-center text-foreground">
        <Clock className="size-4 text-muted-foreground" />
        <span className="font-medium">Not deployed yet</span>
      </Row>
      <p>
        This vault doesn&rsquo;t have an on-chain destination yet. Deposits open
        once it&rsquo;s live.
      </p>
    </Column>
  )
}

async function signTransactions(
  transactions: string[],
  wallet: unknown,
  signAndSendTransaction: (args: {
    transaction: Uint8Array
    wallet: unknown
  }) => Promise<unknown>,
) {
  for (const tx of transactions) {
    await signAndSendTransaction({
      transaction: Uint8Array.from(atob(tx), (c) => c.charCodeAt(0)),
      wallet,
    })
  }
}

function DepositTab({
  vault,
  onDone,
}: {
  vault: DepositPanelProps["vault"]
  onDone?: () => void
}) {
  const queryClient = useQueryClient()
  const { ready, authenticated, login, wallet, walletAddress, signAndSendTransaction } =
    useWallet()
  const [isPending, setIsPending] = React.useState(false)

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
  } = useForm<AmountFormData>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: "" },
  })

  const onSubmit = async (data: AmountFormData) => {
    if (!wallet || !walletAddress) return
    setIsPending(true)

    try {
      const amountLamports = Math.floor(parseFloat(data.amount) * 1e6)
      const { transactions } = await request<{ transactions: string[] }>(
        `/api/vaults/${vault.id}/deposit/build`,
        {
          method: "POST",
          body: JSON.stringify({ walletAddress, amountLamports }),
        },
      )

      await signTransactions(
        transactions,
        wallet,
        signAndSendTransaction as (args: { transaction: Uint8Array; wallet: unknown }) => Promise<unknown>,
      )

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["holdings"] }),
        queryClient.invalidateQueries({ queryKey: ["usdc-balance"] }),
      ])

      toast.success("Deposit submitted", {
        description: `Vault tokens minted to your wallet.`,
      })
      reset()
      onDone?.()
    } catch (e: unknown) {
      console.error("Deposit error:", e)
      toast.error("Deposit failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setIsPending(false)
    }
  }

  const handleMax = () => {
    if (balance == null) return
    setValue("amount", String(balance), { shouldValidate: true })
  }

  if (!ready) {
    return (
      <Button size="lg" className="w-full" disabled>
        Loading…
      </Button>
    )
  }
  if (!authenticated) {
    return (
      <Button size="lg" className="w-full" onClick={() => login()}>
        Connect wallet
      </Button>
    )
  }

  const marketOpen = isMarketOpen()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Column>
        <Column>
          <Row className="items-center justify-between">
            <Label htmlFor="deposit-amount">Amount (USDC)</Label>
            {balance !== undefined && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleMax}
              >
                Balance{" "}
                <MonoNumber value={balance} format="usd" size="sm" />
              </Button>
            )}
          </Row>

          <Input
            id="deposit-amount"
            type="number"
            step="any"
            inputMode="decimal"
            placeholder="0.00"
            disabled={isPending}
            aria-invalid={!!errors.amount}
            {...register("amount")}
          />
          {errors.amount && <FormError message={errors.amount.message} />}
        </Column>

        <Column>
          <LoadingButton
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isPending}
            disabled={!marketOpen}
          >
            Deposit USDC
          </LoadingButton>
          {!marketOpen && (
            <p className="text-center text-sm text-muted-foreground">
              {marketStatusText()}
            </p>
          )}
        </Column>
      </Column>
    </form>
  )
}

function WithdrawTab({
  vault,
  onDone,
}: {
  vault: DepositPanelProps["vault"]
  onDone?: () => void
}) {
  const queryClient = useQueryClient()
  const { ready, authenticated, login, wallet, walletAddress, signAndSendTransaction } =
    useWallet()
  const { holdings } = useHoldings()
  const [isPending, setIsPending] = React.useState(false)

  const holding = holdings.find((h) => h.vaultId === vault.id)
  const maxShares = holding?.balanceUi ?? 0

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<AmountFormData>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: "" },
  })

  const onSubmit = async (data: AmountFormData) => {
    if (!wallet || !walletAddress) return
    setIsPending(true)

    try {
      const shares = parseFloat(data.amount)
      const { transactions } = await request<{ transactions: string[] }>(
        `/api/vaults/${vault.id}/withdraw/build`,
        {
          method: "POST",
          body: JSON.stringify({ walletAddress, shares }),
        },
      )

      await signTransactions(
        transactions,
        wallet,
        signAndSendTransaction as (args: { transaction: Uint8Array; wallet: unknown }) => Promise<unknown>,
      )

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["holdings"] }),
        queryClient.invalidateQueries({ queryKey: ["usdc-balance"] }),
      ])

      toast.success("Withdrawal submitted", {
        description: `USDC returned to your wallet.`,
      })
      reset()
      onDone?.()
    } catch (e: unknown) {
      console.error("Withdraw error:", e)
      toast.error("Withdraw failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setIsPending(false)
    }
  }

  const handleMax = () => {
    if (!maxShares) return
    setValue("amount", String(maxShares), { shouldValidate: true })
  }

  if (!ready) {
    return (
      <Button size="lg" className="w-full" disabled>
        Loading…
      </Button>
    )
  }
  if (!authenticated) {
    return (
      <Button size="lg" className="w-full" onClick={() => login()}>
        Connect wallet
      </Button>
    )
  }

  const marketOpen = isMarketOpen()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Column>
        <Column>
          <Row className="items-center justify-between">
            <Label htmlFor="withdraw-amount">Shares</Label>
            {maxShares > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleMax}
              >
                Holding{" "}
                <MonoNumber
                  value={maxShares}
                  format="raw"
                  precision={4}
                  size="sm"
                />
              </Button>
            )}
          </Row>

          <Input
            id="withdraw-amount"
            type="number"
            step="any"
            inputMode="decimal"
            placeholder="0.00"
            disabled={isPending}
            aria-invalid={!!errors.amount}
            {...register("amount")}
          />
          {errors.amount && <FormError message={errors.amount.message} />}
        </Column>

        <Column>
          <LoadingButton
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isPending}
            disabled={maxShares === 0 || !marketOpen}
          >
            Withdraw
          </LoadingButton>
          {!marketOpen && (
            <p className="text-center text-sm text-muted-foreground">
              {marketStatusText()}
            </p>
          )}
        </Column>
      </Column>
    </form>
  )
}

export function DepositPanelSkeleton({ className }: { className?: string }) {
  return (
    <Column data-slot="deposit-panel-skeleton" className={className}>
      <Skeleton className="h-9 w-44 rounded-sm" />
      <Column>
        <Row className="items-center justify-between">
          <Skeleton className="h-3 w-20 rounded-sm" />
          <Skeleton className="h-3 w-24 rounded-sm" />
        </Row>
        <Skeleton className="h-9 w-full rounded-sm" />
      </Column>
      <Skeleton className="h-10 w-full rounded-sm" />
    </Column>
  )
}
