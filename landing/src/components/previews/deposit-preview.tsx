import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Holding = {
  ticker: string
  name: string
  src: string
  weightPct: number
  delta24h: number
}

const HOLDINGS: Holding[] = [
  { ticker: "NVDAx",  name: "Nvidia",         src: "https://ik.imagekit.io/8dj2mc8pj/NVDAx.png",  weightPct: 22, delta24h: 2.84 },
  { ticker: "MSTRx",  name: "Strategy",       src: "https://ik.imagekit.io/8dj2mc8pj/MSTRx.png",  weightPct: 18, delta24h: 4.21 },
  { ticker: "COINx",  name: "Coinbase",       src: "https://ik.imagekit.io/8dj2mc8pj/COINx.png",  weightPct: 16, delta24h: 1.97 },
  { ticker: "PLTRx",  name: "Palantir",       src: "https://ik.imagekit.io/8dj2mc8pj/PLTRx.png",  weightPct: 16, delta24h: -0.62 },
  { ticker: "HOODx",  name: "Robinhood",      src: "https://ik.imagekit.io/8dj2mc8pj/HOODx.png",  weightPct: 14, delta24h: 3.10 },
  { ticker: "GLXYx",  name: "Galaxy Digital", src: "https://ik.imagekit.io/8dj2mc8pj/GLXYx.png",  weightPct: 14, delta24h: 5.66 },
]

export function DepositPreview({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col gap-5 p-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Composition
        </h3>
        <span className="text-xs text-muted-foreground/70">
          {HOLDINGS.length} holdings
        </span>
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
              loading="lazy"
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
                {h.weightPct.toFixed(2)}%
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

      <Button size="lg" className="w-full text-base font-semibold" tabIndex={-1} disabled>
        Buy
      </Button>
    </Card>
  )
}
