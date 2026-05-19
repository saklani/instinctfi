import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"
import { FormError } from "@/components/ui/form-error"
import { MonoNumber } from "@/components/ui/mono-number"
import { withdrawOrder } from "@/lib/api"
import { useVaults } from "@/hooks/use-vaults"
import { toTitleCase } from "@/lib/format"
import type { Holding } from "@/hooks/use-holdings"

const MIN_LEG_USDC = 5

function minWithdrawUsdc(weightsBps: number[]): number | null {
  if (weightsBps.length === 0) return null
  const minWeight = Math.min(...weightsBps)
  if (minWeight <= 0) return null
  return (MIN_LEG_USDC * 10000) / minWeight
}

type WithdrawDialogProps = {
  holding: Holding
  children: React.ReactNode
}

export function WithdrawDialog({ holding, children }: WithdrawDialogProps) {
  const queryClient = useQueryClient()
  const { vaults } = useVaults()
  const fullVault = vaults.find((v) => v.id === holding.vault.id)
  const minAmount = fullVault
    ? minWithdrawUsdc(fullVault.compositions.map((c) => c.weight))
    : null
  const maxAmount = holding.currentValueUsdc

  const schema = z.object({
    amount: z
      .string()
      .min(1, "Enter an amount")
      .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0")
      .refine(
        (v) => minAmount == null || parseFloat(v) >= minAmount,
        `Min withdraw is $${minAmount?.toFixed(2) ?? "—"}`,
      )
      .refine(
        (v) => parseFloat(v) <= maxAmount + 0.005,
        `Max withdraw is $${maxAmount.toFixed(2)}`,
      ),
  })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "" },
  })

  const { mutate: submit, isPending } = useMutation({
    mutationFn: ({ amount }: FormData) =>
      withdrawOrder({ vaultId: holding.vault.id, amountUsdc: amount }),
    onSuccess: () => {
      toast.success("Withdrawal queued")
      reset()
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["portfolio"] })
      queryClient.invalidateQueries({ queryKey: ["usdc-balance"] })
    },
    onError: (e: unknown) => {
      toast.error("Withdraw failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    },
  })

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Withdraw from {toTitleCase(holding.vault.name)}
          </DialogTitle>
          <DialogDescription>
            <Row className="items-center gap-2">
              <span>Position</span>
              <MonoNumber value={maxAmount} format="usd" size="md" />
            </Row>
          </DialogDescription>
        </DialogHeader>

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
                  Max
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

            <DialogFooter>
              <LoadingButton
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isPending}
              >
                Withdraw
              </LoadingButton>
            </DialogFooter>
          </Column>
        </form>
      </DialogContent>
    </Dialog>
  )
}
