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
import { useVaults } from "@/hooks/use-vaults"
import { useHoldings } from "@/hooks/use-holdings"
import { depositOrder, withdrawOrder } from "@/lib/api"
import { getUsdcBalance } from "@/lib/transfer"

const MIN_LEG_USDC = 5

/**
 * Vault's minimum deposit is dictated by the lowest-weighted leg —
 * that leg must receive at least MIN_LEG_USDC for Jupiter to route.
 * Returns null when composition isn't loaded yet.
 */
function minDepositUsdc(weightsBps: number[]): number | null {
  if (weightsBps.length === 0) return null
  const minWeight = Math.min(...weightsBps)
  if (minWeight <= 0) return null
  return (MIN_LEG_USDC * 10000) / minWeight
}
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
        <WithdrawTab vault={vault} onDone={onDone} />
      </TabsContent>
    </Tabs>
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
  const {
    ready,
    authenticated,
    login,
    walletAddress,
    signAndSendTransaction,
    wallet,
    instinctAddress,
  } = useWallet()

  const { vaults: allVaults } = useVaults()
  const fullVault = allVaults.find((v) => v.id === vault.id)
  const minDeposit = fullVault
    ? minDepositUsdc(fullVault.compositions.map((c) => c.weight))
    : null

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
      if (minDeposit && parseFloat(amount) < minDeposit) {
        throw new Error(`Minimum deposit for this vault is $${minDeposit.toFixed(2)}`)
      }

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

      // Hand off to the server and return immediately. The Inngest worker
      // verifies on-chain + executes swaps in the background; the user sees
      // progress in their Activity feed (orders are polled every 15s).
      return depositOrder({
        vaultId: vault.id,
        signature,
        amountUsdc: amount,
      })
    },
    onSuccess: () => {
      toast.success("Deposit queued")
      reset()
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
      <Button size="lg" className="w-full mt-6" disabled>
        Loading…
      </Button>
    )
  }
  if (!authenticated) {
    return (
      <Button size="lg" className="w-full mt-6" onClick={() => login()}>
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
            placeholder={minDeposit ? `${minDeposit.toFixed(2)} or more` : "0.00"}
            disabled={isPending}
            aria-invalid={!!errors.amount}
            {...register("amount")}
          />
          {errors.amount && <FormError message={errors.amount.message} />}
          {minDeposit && !errors.amount && (
            <p className="text-xs text-muted-foreground">
              Minimum deposit ${minDeposit.toFixed(2)}.
            </p>
          )}
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

function WithdrawTab({
  vault,
  onDone,
}: {
  vault: DepositPanelProps["vault"]
  onDone?: () => void
}) {
  const queryClient = useQueryClient()
  const { ready, authenticated, login } = useWallet()
  const { vaults: allVaults } = useVaults()
  const { holdings } = useHoldings()

  const fullVault = allVaults.find((v) => v.id === vault.id)
  const minAmount = fullVault
    ? minDepositUsdc(fullVault.compositions.map((c) => c.weight))
    : null
  const holding = holdings.find((h) => h.vault.id === vault.id)
  const maxAmount = holding?.currentValueUsdc ?? 0

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
      const value = parseFloat(amount)
      if (minAmount && value < minAmount) {
        throw new Error(`Minimum withdraw is $${minAmount.toFixed(2)}`)
      }
      if (value > maxAmount + 0.005) {
        throw new Error(`Maximum withdraw is $${maxAmount.toFixed(2)}`)
      }
      return withdrawOrder({ vaultId: vault.id, amountUsdc: amount })
    },
    onSuccess: () => {
      toast.success("Withdrawal queued")
      reset()
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["portfolio"] })
      queryClient.invalidateQueries({ queryKey: ["usdc-balance"] })
      onDone?.()
    },
    onError: (e: unknown) => {
      toast.error("Withdraw failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    },
  })

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

  if (!holding || maxAmount <= 0) {
    return (
      <Column className="rounded-sm border border-dashed border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground">No position to withdraw</p>
        <p>Deposit into this vault first.</p>
      </Column>
    )
  }

  return (
    <form onSubmit={handleSubmit((d) => submit(d))}>
      <Column>
        <Column>
          <Row className="items-center justify-between">
            <Label htmlFor="withdraw-amount">Amount (USDC)</Label>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() =>
                setValue("amount", maxAmount.toFixed(2), {
                  shouldValidate: true,
                })
              }
            >
              Position <MonoNumber value={maxAmount} format="usd" size="sm" />
            </Button>
          </Row>

          <Input
            id="withdraw-amount"
            type="number"
            step="any"
            inputMode="decimal"
            placeholder={
              minAmount
                ? `${minAmount.toFixed(2)} – ${maxAmount.toFixed(2)}`
                : "0.00"
            }
            disabled={isPending}
            aria-invalid={!!errors.amount}
            {...register("amount")}
          />
          {errors.amount && <FormError message={errors.amount.message} />}
          {minAmount && !errors.amount && (
            <p className="text-xs text-muted-foreground">
              Min ${minAmount.toFixed(2)} · Max ${maxAmount.toFixed(2)}
            </p>
          )}
        </Column>

        <Column>
          <LoadingButton
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isPending}
          >
            Withdraw
          </LoadingButton>
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
