import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const PRESETS = [10, 25, 50, 100]

const AMOUNT = "100"

const BALANCE = "1,284.50"

export function DepositPreview({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Amount (USDC)</label>
            <span className="text-xs text-muted-foreground">Balance: ${BALANCE}</span>
          </div>
          <div
            aria-hidden="true"
            className="flex h-12 items-center rounded-md border border-border bg-input/30 px-3 text-lg text-foreground"
          >
            {AMOUNT}.00
          </div>
        </div>

        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p}
              type="button"
              variant="outline"
              size="sm"
              className={cn("flex-1", String(p) === AMOUNT && "bg-muted text-foreground")}
              tabIndex={-1}
            >
              ${p}
            </Button>
          ))}
        </div>

        <Button size="lg" className="w-full text-base font-semibold" tabIndex={-1}>
          Deposit
        </Button>
      </div>
    </Card>
  )
}
