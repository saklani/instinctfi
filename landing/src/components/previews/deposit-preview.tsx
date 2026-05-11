import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const VAULT = {
  name: "Bald Founder Index",
  icon: "https://ik.imagekit.io/8dj2mc8pj/bald_founder_index.png",
}

type Holding = {
  ticker: string
  name: string
  src: string
  weightPct: number
  delta24h: number
}

const HOLDINGS: Holding[] = [
  { ticker: "AMZNx", name: "Amazon",         src: "https://ik.imagekit.io/8dj2mc8pj/AMZNx.png", weightPct: 31, delta24h:  1.24 },
  { ticker: "COINx", name: "Coinbase",       src: "https://ik.imagekit.io/8dj2mc8pj/COINx.png", weightPct: 27, delta24h:  3.42 },
  { ticker: "MSFTx", name: "Microsoft",      src: "https://ik.imagekit.io/8dj2mc8pj/MSFTx.png", weightPct: 22, delta24h:  0.51 },
  { ticker: "GLXYx", name: "Galaxy Digital", src: "https://ik.imagekit.io/8dj2mc8pj/GLXYx.png", weightPct: 20, delta24h: -0.86 },
]

const AMOUNT = "100"

const BALANCE = "1,284.50"

export function DepositPreview({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col gap-5 p-6", className)}>
      <div className="flex items-center gap-3">
        <img
          src={VAULT.icon}
          alt={VAULT.name}
          className="size-10 rounded-full bg-secondary object-cover ring-1 ring-black/5"
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm lg:text-base font-semibold tracking-tight text-foreground">
            {VAULT.name}
          </span>
          <span className="text-xs text-muted-foreground/70">
            {HOLDINGS.length} holdings
          </span>
        </div>
      </div>

      <ol className="flex flex-col divide-y divide-border">
        {HOLDINGS.map((h, i) => (
          <li
            key={h.ticker}
            className="grid grid-cols-[28px_24px_1fr_auto] items-center gap-3 px-1 py-2.5"
          >
            <span className="font-mono text-xs tabular-nums text-muted-foreground/70">
              {String(i + 1).padStart(2, "0")}
            </span>
            <img
              src={h.src}
              alt={h.ticker}
              className="size-6 rounded-full bg-secondary object-cover"
            />
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {h.name}
              </span>
              <span className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:inline">
                {h.ticker}
              </span>
            </span>
            <span className="flex items-baseline gap-3">
              <span className="font-mono text-sm tabular-nums text-foreground">
                {h.weightPct}%
              </span>
              <span
                className={cn(
                  "font-mono text-xs tabular-nums",
                  h.delta24h >= 0 ? "text-emerald-600" : "text-red-600",
                )}
              >
                {h.delta24h >= 0 ? "+" : ""}
                {h.delta24h.toFixed(2)}%
              </span>
            </span>
          </li>
        ))}
      </ol>

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

      <Button size="lg" className="w-full text-base font-semibold" tabIndex={-1} disabled>
        Buy
      </Button>
    </Card>
  )
}
