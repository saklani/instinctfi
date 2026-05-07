import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion"
import { ArrowUpRight, Clock } from "lucide-react"

import { useWallet } from "@/hooks/use-wallet"
import { useTreasuryAddress } from "@/components/api-provider"
import { createDeposit, useOrders } from "@/features/orders"
import { getUsdcBalance } from "@/lib/transfer"
import { formatRaw } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import { TabPill, TabPillItem } from "@/components/ui/tab-pill"
import { MonoNumber } from "@/components/ui/mono-number"
import { Badge } from "@/components/ui/badge"
import { LoadingButton } from "@/components/ui/loading-button"
import { FormError } from "@/components/ui/form-error"
import { Skeleton } from "@/components/ui/skeleton"
import type { Vault } from "@/db/schema"
import type { Order } from "@/features/orders/api"
import { PathDraw, durations, outQuart } from "@/components/motion"

const depositSchema = z.object({
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
})

type DepositFormData = z.infer<typeof depositSchema>

type DepositPanelTab = "deposit" | "withdraw" | "history"

type DepositPanelProps = {
  vault: Pick<Vault, "id" | "name" | "address">
  className?: string
  /** Called after a successful deposit. Use to close a Sheet etc. */
  onDone?: () => void
  defaultTab?: DepositPanelTab
}

export function DepositPanel({
  vault,
  className,
  onDone,
  defaultTab = "deposit",
}: DepositPanelProps) {
  const [tab, setTab] = React.useState<DepositPanelTab>(defaultTab)
  const isLive = vault.address != null

  return (
    <Column data-slot="deposit-panel" className={className}>
      <TabPill
        value={tab}
        onValueChange={(next) => setTab(next as DepositPanelTab)}
        layoutId="deposit-panel-tabs"
        className="self-start"
      >
        <TabPillItem value="deposit">Deposit</TabPillItem>
        <TabPillItem value="withdraw">Withdraw</TabPillItem>
        <TabPillItem value="history">History</TabPillItem>
      </TabPill>

      {!isLive && tab === "deposit" && <NotDeployed />}
      {isLive && tab === "deposit" && <DepositTab vault={vault} onDone={onDone} />}
      {tab === "withdraw" && <WithdrawTab vault={vault} />}
      {tab === "history" && <HistoryTab vaultId={vault.id} />}
    </Column>
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

function DepositTab({
  vault,
  onDone,
}: {
  vault: DepositPanelProps["vault"]
  onDone?: () => void
}) {
  const queryClient = useQueryClient()
  const treasuryAddress = useTreasuryAddress()
  const { ready, authenticated, login, wallet, walletAddress, signAndSendTransaction } =
    useWallet()
  const [isPending, setIsPending] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)

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
    watch,
    formState: { errors },
    reset,
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: "" },
  })

  const amountStr = watch("amount")
  const numericAmount = parseFloat(amountStr || "0")
  const estimatedShares =
    Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 0

  const onSubmit = async (data: DepositFormData) => {
    if (!treasuryAddress || !wallet || !walletAddress) return
    setIsPending(true)

    try {
      const rawAmount = BigInt(Math.floor(parseFloat(data.amount) * 1e6))
      const { buildUsdcTransfer } = await import("@/lib/transfer")
      const { transaction } = await buildUsdcTransfer({
        from: walletAddress,
        to: treasuryAddress,
        amount: rawAmount,
      })

      const { signature } = await signAndSendTransaction({
        transaction: new Uint8Array(transaction),
        wallet,
      })

      const { getBase58Codec } = await import("@solana/codecs-strings")
      const sigString =
        typeof signature === "string"
          ? signature
          : getBase58Codec().decode(signature)

      await createDeposit({
        vaultId: vault.id,
        signature: sigString,
        address: walletAddress,
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["positions"] }),
        queryClient.invalidateQueries({ queryKey: ["usdc-balance"] }),
      ])

      toast.success("Order placed", {
        description: `Depositing into ${vault.name}.`,
      })
      reset()
      setShowSuccess(true)
      window.setTimeout(() => {
        setShowSuccess(false)
        onDone?.()
      }, 1800)
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

  const ctaLabel = !ready
    ? "Loading…"
    : !authenticated
      ? "Connect wallet"
      : "Deposit USDC"

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <SuccessState key="success" amount={numericAmount} />
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: outQuart }}
            className="flex flex-col"
          >
            <Column>
              <Row className="items-center justify-between">
                <label
                  htmlFor="deposit-amount"
                  className="text-xs text-muted-foreground"
                >
                  Amount
                </label>
                {authenticated && balance !== undefined && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleMax}
                    className="text-muted-foreground"
                  >
                    Balance{" "}
                    <MonoNumber
                      value={balance}
                      format="usd"
                      size="sm"
                      className="text-foreground"
                    />
                  </Button>
                )}
              </Row>

              <div
                className={cn(
                  "group/amount relative flex items-center rounded-md border border-border bg-secondary",
                  "transition-[background-color,border-color,box-shadow] duration-200 ease-out",
                  "focus-within:border-accent/40 focus-within:bg-card focus-within:ring-[4px] focus-within:ring-accent/20",
                  errors.amount && "border-destructive focus-within:border-destructive",
                )}
              >
                <input
                  id="deposit-amount"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="h-14 flex-1 bg-transparent font-mono text-2xl tabular-nums text-foreground outline-none placeholder:text-muted-foreground/70"
                  disabled={isPending}
                  aria-invalid={!!errors.amount}
                  {...register("amount")}
                />
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  USDC
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleMax}
                  disabled={!authenticated || balance == null || isPending}
                  className="font-mono uppercase tracking-[0.06em]"
                >
                  Max
                </Button>
              </div>
              {errors.amount && <FormError message={errors.amount.message} />}
            </Column>

            <Column className="rounded-sm bg-secondary/60">
              <SummaryRow label="Estimated shares">
                <MonoNumber value={estimatedShares} size="md" precision={4} />
              </SummaryRow>
            </Column>

            {!authenticated ? (
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => login()}
                disabled={!ready}
              >
                {ctaLabel}
              </Button>
            ) : (
              <LoadingButton
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isPending}
                disabled={!treasuryAddress}
              >
                {ctaLabel}
              </LoadingButton>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

function WithdrawTab({ vault: _vault }: { vault: DepositPanelProps["vault"] }) {
  return (
    <Column className="rounded-sm border border-dashed border-border text-xs text-muted-foreground">
      <Row className="items-center text-foreground">
        <Clock className="size-4 text-muted-foreground" />
        <span className="font-medium">Withdrawals coming soon</span>
      </Row>
      <p>Redemptions are queued at the next NAV print.</p>
    </Column>
  )
}

function HistoryTab({
  vaultId,
  ordersOverride,
}: {
  vaultId: string
  ordersOverride?: Order[]
}) {
  const live = useOrders()
  const orders = ordersOverride ?? live.orders
  const loading = ordersOverride ? false : live.loading
  const filtered = orders.filter((o) => o.vaultId === vaultId)

  if (loading) {
    return (
      <Column>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-sm" />
        ))}
      </Column>
    )
  }

  if (!filtered.length) {
    return (
      <div className="rounded-sm border border-dashed border-border text-xs text-muted-foreground">
        No transactions yet.
      </div>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {filtered.map((order) => (
        <li key={order.id}>
          <HistoryRow order={order} />
        </li>
      ))}
    </ul>
  )
}

function HistoryRow({ order }: { order: Order }) {
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  const amount = formatRaw(order.amount)
  const tone =
    order.status === "completed"
      ? "default"
      : order.status === "failed" || order.status === "cancelled"
        ? "destructive"
        : "secondary"

  const inner = (
    <div className="grid grid-cols-[auto_1fr_auto] items-center">
      <span className="font-mono text-xs tabular-nums text-muted-foreground/70">{date}</span>
      <span className="flex items-center text-xs text-foreground">
        <span className="capitalize">{order.type}</span>
        <Badge variant={tone} className="capitalize">
          {order.status}
        </Badge>
      </span>
      <span className="flex items-center font-mono text-sm tabular-nums text-foreground">
        {amount}
        {order.signature && (
          <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden />
        )}
      </span>
    </div>
  )

  if (order.signature) {
    return (
      <a
        href={`https://solscan.io/tx/${order.signature}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-sm transition-colors duration-150 hover:bg-secondary outline-none focus-visible:bg-secondary focus-visible:ring-[3px] focus-visible:ring-accent/30"
      >
        {inner}
      </a>
    )
  }
  return <div>{inner}</div>
}

function SummaryRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Row className="items-baseline justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{children}</span>
    </Row>
  )
}

export { WithdrawTab as DepositPanelWithdrawView }
export { HistoryTab as DepositPanelHistoryView }
export { SuccessState as DepositSuccessState }

export function DepositPanelSkeleton({ className }: { className?: string }) {
  return (
    <Column data-slot="deposit-panel-skeleton" className={className}>
      <Row className="items-center self-start rounded-full bg-secondary">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </Row>
      <Column>
        <Row className="items-center justify-between">
          <Skeleton className="h-3 w-12 rounded-sm" />
          <Skeleton className="h-3 w-20 rounded-sm" />
        </Row>
        <Skeleton className="h-14 w-full rounded-md" />
      </Column>
      <Column className="rounded-sm bg-secondary/60">
        <Row className="items-center justify-between">
          <Skeleton className="h-3 w-24 rounded-sm" />
          <Skeleton className="h-4 w-16 rounded-sm" />
        </Row>
        <Row className="items-center justify-between">
          <Skeleton className="h-3 w-28 rounded-sm" />
          <Skeleton className="h-3 w-12 rounded-sm" />
        </Row>
      </Column>
      <Skeleton className="h-12 w-full rounded-full" />
    </Column>
  )
}

function SuccessState({ amount }: { amount: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      key="success"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.24, ease: outQuart }}
      data-slot="deposit-success"
      className="flex min-h-[220px] flex-col items-center justify-center text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-accent shadow-sm">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden
          className="size-8"
        >
          <PathDraw
            d="M9 16.5 14 21.5 23 11.5"
            stroke="var(--accent-ink)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            duration={durations.checkmark}
          />
        </svg>
      </div>
      <Column>
        <p>Order placed</p>
        <p>
          Depositing{" "}
          <MonoNumber
            value={amount}
            format="usd"
            size="sm"
            className="text-foreground"
          />{" "}
          — settles at next NAV print.
        </p>
      </Column>
    </motion.div>
  )
}
