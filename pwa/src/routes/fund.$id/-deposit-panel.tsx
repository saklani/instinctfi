import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import bs58 from "bs58"
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js"
import {
  createTransferCheckedInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token"

import { useWallet } from "@/hooks/use-wallet"
import { depositOrder, getOrder, type AuthResponse } from "@/lib/api"
import { getUsdcBalance } from "@/lib/transfer"
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

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
const USDC_DECIMALS = 6
const RPC_URL =
  import.meta.env.VITE_RPC_URL ?? "https://api.mainnet-beta.solana.com"

const amountSchema = z.object({
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
})

type AmountFormData = z.infer<typeof amountSchema>

type DepositPanelTab = "deposit" | "withdraw"

type DepositPanelProps = {
  vault: Pick<Vault, "id" | "name">
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
        <WithdrawTab />
      </TabsContent>
    </Tabs>
  )
}

/** Polls /api/orders/:id until completed / failed / cancelled / timeout. */
async function waitForOrder(id: string, timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const order = await getOrder(id)
    if (
      order.status === "completed" ||
      order.status === "failed" ||
      order.status === "cancelled"
    ) {
      return order
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  // Returns even on timeout — caller decides what to surface. Off-hours orders
  // can sit in `processing` for hours under the retry loop, so we don't throw.
  return getOrder(id)
}

function DepositTab({
  vault,
  onDone,
}: {
  vault: DepositPanelProps["vault"]
  onDone?: () => void
}) {
  const queryClient = useQueryClient()
  const {
    ready,
    authenticated,
    login,
    walletAddress,
    signAndSendTransaction,
    wallet,
  } = useWallet()

  // Instinct wallet address — stashed by api-provider on /api/auth response.
  const auth = queryClient.getQueryData<AuthResponse>(["auth"])
  const instinctAddress = auth?.instinctAddress

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

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async ({ amount }: AmountFormData) => {
      if (!walletAddress) throw new Error("No wallet connected")
      if (!instinctAddress) throw new Error("Instinct wallet not provisioned yet")

      const connection = new Connection(RPC_URL, "confirmed")
      const connectedPk = new PublicKey(walletAddress)
      const instinctPk = new PublicKey(instinctAddress)

      const connectedAta = getAssociatedTokenAddressSync(USDC_MINT, connectedPk)
      const instinctAta = getAssociatedTokenAddressSync(USDC_MINT, instinctPk)

      const amountAtomic = BigInt(Math.floor(parseFloat(amount) * 10 ** USDC_DECIMALS))

      const { blockhash } = await connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: connectedPk,
        recentBlockhash: blockhash,
        instructions: [
          // Idempotent ATA create — no-op if instinct's USDC ATA already exists.
          createAssociatedTokenAccountIdempotentInstruction(
            connectedPk,
            instinctAta,
            instinctPk,
            USDC_MINT,
          ),
          createTransferCheckedInstruction(
            connectedAta,
            USDC_MINT,
            instinctAta,
            connectedPk,
            amountAtomic,
            USDC_DECIMALS,
          ),
        ],
      }).compileToV0Message()
      const tx = new VersionedTransaction(message)

      const sendResult = await (
        signAndSendTransaction as (args: {
          transaction: Uint8Array
          wallet: unknown
          chain?: string
        }) => Promise<{ signature: Uint8Array }>
      )({ transaction: tx.serialize(), wallet, chain: "solana:mainnet" })

      const signature = bs58.encode(sendResult.signature)

      // No client-side confirmation wait — the Inngest worker handles RPC
      // verification with durable retries.
      const order = await depositOrder({
        vaultId: vault.id,
        signature,
        amountUsdc: amount,
      })
      const settled = await waitForOrder(order.id)

      if (settled.status === "failed") {
        throw new Error(settled.error ?? "Deposit failed")
      }
      return settled
    },
    onSuccess: (order) => {
      if (order.status === "completed") {
        const filled = order.result.filter((r) => r.ok).length
        toast.success("Deposit settled", {
          description: `${filled} swap${filled === 1 ? "" : "s"} filled`,
        })
      } else {
        // Still processing past the 60s poll — off-hours retry loop is running.
        toast.info("Deposit queued", {
          description:
            "Waiting for market makers to quote. Check Activity for status.",
        })
      }
      reset()
      queryClient.invalidateQueries({ queryKey: ["portfolio"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["usdc-balance"] })
      onDone?.()
    },
    onError: (e: unknown) => {
      toast.error("Deposit failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    },
  })

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

  return (
    <form onSubmit={handleSubmit((d) => submit(d))}>
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
                Balance <MonoNumber value={balance} format="usd" size="sm" />
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
            disabled={!instinctAddress}
          >
            Deposit USDC
          </LoadingButton>
        </Column>
      </Column>
    </form>
  )
}

function WithdrawTab() {
  return (
    <Column className="rounded-sm border border-dashed border-border text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Withdrawals coming soon</p>
      <p>
        Your basket lives in the Instinct wallet we manage for you. Withdrawal
        will swap it back to USDC and (for external connected wallets) transfer
        it home.
      </p>
    </Column>
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
