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
import { useServerWallet } from "@/components/api-provider"
import { createDeposit, useOrders } from "@/features/orders"
import { getUsdcBalance } from "@/lib/transfer"
import { formatRaw } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TabPill, TabPillItem } from "@/components/ui/tab-pill"
import { MonoNumber } from "@/components/ui/mono-number"
import { Badge } from "@/components/ui/badge"
import { LoadingButton } from "@/components/ui/loading-button"
import { FormError } from "@/components/ui/form-error"
import { PathDraw } from "@/components/motion/path-draw"
import { durations, outQuart } from "@/components/motion/easings"
import type { Vault } from "@/features/vaults/api"
import type { Order } from "@/features/orders/api"

const depositSchema = z.object({
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
})

type DepositFormData = z.infer<typeof depositSchema>

type DepositPanelTab = "deposit" | "withdraw" | "history"

type DepositPanelProps = {
  vault: Pick<Vault, "id" | "name" | "depositFeeBps" | "withdrawFeeBps">
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

  return (
    <div
      data-slot="deposit-panel"
      className={cn("flex flex-col gap-5", className)}
    >
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

      {tab === "deposit" && <DepositTab vault={vault} onDone={onDone} />}
      {tab === "withdraw" && <WithdrawTab vault={vault} />}
      {tab === "history" && <HistoryTab vaultId={vault.id} />}
    </div>
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
  const serverWallet = useServerWallet()
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
  const feePct = vault.depositFeeBps / 10000
  const effectiveAmount =
    Number.isFinite(numericAmount) && numericAmount > 0
      ? numericAmount * (1 - feePct)
      : 0
  const feeAmount =
    Number.isFinite(numericAmount) && numericAmount > 0
      ? numericAmount * feePct
      : 0

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
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="deposit-amount"
                  className="text-body-sm text-ink-muted"
                >
                  Amount
                </label>
                {authenticated && balance !== undefined && (
                  <button
                    type="button"
                    onClick={handleMax}
                    className="text-body-sm text-ink-muted hover:text-ink"
                  >
                    Balance{" "}
                    <MonoNumber
                      value={balance}
                      format="usd"
                      size="sm"
                      className="text-ink"
                    />
                  </button>
                )}
              </div>

              <div
                className={cn(
                  "group/amount relative flex items-center gap-2 rounded-input border border-hairline bg-secondary px-4",
                  "transition-[background-color,border-color,box-shadow] duration-200 ease-out",
                  "focus-within:border-accent/40 focus-within:bg-surface focus-within:ring-[4px] focus-within:ring-accent/20",
                  errors.amount && "border-destructive focus-within:border-destructive",
                )}
              >
                <input
                  id="deposit-amount"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="h-14 flex-1 bg-transparent font-mono text-mono-xl tabular text-ink outline-none placeholder:text-ink-faint"
                  disabled={isPending}
                  aria-invalid={!!errors.amount}
                  {...register("amount")}
                />
                <span className="font-mono text-mono-md tabular text-ink-muted">
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
            </div>

            <div className="flex flex-col gap-2 rounded-tag bg-secondary/60 px-4 py-3">
              <SummaryRow label="Estimated shares">
                <MonoNumber value={effectiveAmount} size="md" precision={4} />
              </SummaryRow>
              <SummaryRow label={`Deposit fee (${(feePct * 100).toFixed(2)}%)`}>
                <MonoNumber
                  value={feeAmount}
                  format="usd"
                  size="sm"
                  className="text-ink-muted"
                />
              </SummaryRow>
            </div>

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
                disabled={!serverWallet}
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

function WithdrawTab({ vault }: { vault: DepositPanelProps["vault"] }) {
  const feePct = vault.withdrawFeeBps / 10000
  return (
    <div className="flex flex-col gap-3 rounded-tag border border-dashed border-hairline px-4 py-6 text-body-sm text-ink-muted">
      <div className="flex items-center gap-2 text-ink">
        <Clock className="size-4 text-ink-muted" />
        <span className="font-medium">Withdrawals coming soon</span>
      </div>
      <p>
        Redemptions are queued at the next NAV print. Withdraw fee:{" "}
        <span className="font-mono text-ink">
          {(feePct * 100).toFixed(2)}%
        </span>
        .
      </p>
    </div>
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
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-tag bg-secondary/60"
            style={{ animationDuration: "2s" }}
          />
        ))}
      </div>
    )
  }

  if (!filtered.length) {
    return (
      <div className="rounded-tag border border-dashed border-hairline px-4 py-6 text-body-sm text-ink-muted">
        No transactions yet.
      </div>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-hairline">
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
      ? "positive"
      : order.status === "failed" || order.status === "cancelled"
        ? "destructive"
        : "secondary"

  const inner = (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
      <span className="font-mono text-mono-sm tabular text-ink-faint">{date}</span>
      <span className="flex items-center gap-2 text-body-sm text-ink">
        <span className="capitalize">{order.type}</span>
        <Badge variant={tone} size="sm" className="capitalize">
          {order.status}
        </Badge>
      </span>
      <span className="flex items-center gap-1 font-mono text-mono-md tabular text-ink">
        {amount}
        {order.signature && (
          <ArrowUpRight className="size-3.5 text-ink-muted" aria-hidden />
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
        className="block rounded-tag px-2 transition-colors duration-150 hover:bg-secondary"
      >
        {inner}
      </a>
    )
  }
  return <div className="px-2">{inner}</div>
}

function SummaryRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between text-body-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink">{children}</span>
    </div>
  )
}

export { WithdrawTab as DepositPanelWithdrawView }
export { HistoryTab as DepositPanelHistoryView }
export { SuccessState as DepositSuccessState }

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
      className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-accent shadow-card">
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
      <div className="flex flex-col gap-1">
        <p className="text-heading font-semibold text-ink">Order placed</p>
        <p className="text-body-sm text-ink-muted">
          Depositing{" "}
          <MonoNumber
            value={amount}
            format="usd"
            size="sm"
            className="text-ink"
          />{" "}
          — settles at next NAV print.
        </p>
      </div>
    </motion.div>
  )
}
