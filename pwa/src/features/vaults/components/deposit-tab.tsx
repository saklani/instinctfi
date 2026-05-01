import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { useWallet } from "@/hooks/use-wallet"
import { useServerWallet } from "@/components/api-provider"
import { createDeposit } from "@/features/orders"
import { getUsdcBalance } from "@/lib/transfer"
import { formatUsd } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Row } from "@/components/ui/row"
import { Column } from "@/components/ui/column"
import { FormError } from "@/components/ui/form-error"
import { LoadingButton } from "@/components/ui/loading-button"

const depositSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (v) => parseFloat(v) > 0,
    "Amount must be greater than 0",
  ),
})

type DepositFormData = z.infer<typeof depositSchema>

export function DepositTab({ vaultId, onDone }: { vaultId: string; onDone: () => void }) {
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
        signature: sigString,
        address: walletAddress!,
      })

      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      await queryClient.invalidateQueries({ queryKey: ["positions"] })
      await queryClient.invalidateQueries({ queryKey: ["usdc-balance"] })

      toast.success("Your order is placed.")
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
