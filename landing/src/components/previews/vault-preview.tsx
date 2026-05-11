import * as React from "react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

type Vault = {
  name: string
  icon: string
  holdings: { ticker: string; src: string }[]
  spark: number[]
  delta: number
}

const VAULTS: Vault[] = [
  {
    name: "Not Insider Trading",
    icon: "https://ik.imagekit.io/8dj2mc8pj/not_insider_trading.png",
    holdings: [
      { ticker: "GOOGLx", src: "https://ik.imagekit.io/8dj2mc8pj/GOOGLx.png" },
      { ticker: "NVDAx",  src: "https://ik.imagekit.io/8dj2mc8pj/NVDAx.png"  },
      { ticker: "AVGOon", src: "https://ik.imagekit.io/8dj2mc8pj/AVGOon.png" },
      { ticker: "AMZNx",  src: "https://ik.imagekit.io/8dj2mc8pj/AMZNx.png"  },
      { ticker: "METAon", src: "https://ik.imagekit.io/8dj2mc8pj/METAon.png" },
      { ticker: "MSFTx",  src: "https://ik.imagekit.io/8dj2mc8pj/MSFTx.png"  },
    ],
    // 5Y curve: $1.000 → $2.794 (matches Pelosi tracker 5Y per pelositracker.app, ~22.8% annualized)
    spark: [100, 108, 118, 108, 94, 87, 91, 102, 118, 135, 158, 178, 198, 220, 242, 256, 265, 272, 277, 279],
    delta: 179.40,
  },
  {
    // Reverse Chamath synthetic 5Y: dominant Rocket Lab + Hims gains offset by UNH/VNQ weakness
    name: "Reverse Chamath",
    icon: "https://ik.imagekit.io/8dj2mc8pj/reverse_chamath.png",
    holdings: [],
    spark: [],
    delta: 218.50,
  },
  {
    // Peptidemaxxing synthetic 5Y: Lilly + Novo GLP-1 boom dominates
    name: "Peptidemaxxing",
    icon: "https://ik.imagekit.io/8dj2mc8pj/peptidemaxxing.png",
    holdings: [],
    spark: [],
    delta: 312.40,
  },
]

const PEEK_HEIGHT = 68
const PEEK_INSET = 14

type VaultPreviewProps = {
  className?: string
  deltas?: (number | undefined)[]
  spark?: number[]
}

export function VaultPreview({ className, deltas, spark }: VaultPreviewProps) {
  const merged: Vault[] = VAULTS.map((v, i) => ({
    ...v,
    delta: deltas?.[i] ?? v.delta,
  }))
  const [defaultFront, ...behind] = merged
  const front: Vault = {
    ...defaultFront,
    spark: spark && spark.length > 0 ? spark : defaultFront.spark,
  }
  const wrapperPaddingTop = behind.length * PEEK_HEIGHT
  return (
    <div
      className={cn("relative", className)}
      style={{ paddingTop: wrapperPaddingTop }}
    >
      {behind.map((v, i) => {
        const depth = i + 1
        const top = (behind.length - depth) * PEEK_HEIGHT
        const inset = depth * PEEK_INSET
        return (
          <div
            key={v.name}
            aria-hidden="true"
            className="absolute"
            style={{ top, left: inset, right: inset, zIndex: behind.length - 1 - i }}
          >
            <div className="flex h-20 items-center justify-between gap-3 rounded-2xl bg-card px-6 ring-1 ring-foreground/10">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={v.icon}
                  alt=""
                  className="size-10 rounded-full bg-secondary object-cover ring-1 ring-black/5"
                />
                <span className="truncate text-lg lg:text-xl leading-[1.05] tracking-tight text-foreground">
                  {v.name}
                </span>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-baseline rounded-md px-2 py-1 text-sm  tabular-nums",
                  v.delta >= 0
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-red-500/10 text-red-600",
                )}
              >
                {v.delta >= 0 ? "+" : ""}{v.delta.toFixed(2)}%
              </span>
            </div>
          </div>
        )
      })}

      <Card
        className="relative justify-between gap-5 p-6"
        style={{ zIndex: behind.length + 1 }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={front.icon}
                alt={front.name}
                className="size-10 rounded-full bg-secondary object-cover ring-1 ring-black/5"
              />
              <h3 className="line-clamp-2 text-2xl leading-[1.05] tracking-tight text-foreground">
                {front.name}
              </h3>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-baseline rounded-md px-2 py-1 text-sm font-medium tabular-nums",
                front.delta >= 0
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-red-500/10 text-red-600",
              )}
            >
              {front.delta >= 0 ? "+" : ""}{front.delta.toFixed(2)}%
            </span>
          </div>
          <HoldingStack holdings={front.holdings} />
        </div>

        <Sparkline values={front.spark} positive={front.delta >= 0} />
      </Card>
    </div>
  )
}

function HoldingStack({ holdings }: { holdings: Vault["holdings"] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center -space-x-1.5">
        {holdings.slice(0, 6).map((h) => (
          <img
            key={h.ticker}
            src={h.src}
            alt={h.ticker}
            title={h.ticker}
            className="size-6 rounded-full bg-secondary object-cover ring-2 ring-card"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground/70">{holdings.length} holdings</span>
    </div>
  )
}

function Sparkline({
  values,
  positive = true,
  width = 320,
  height = 240,
}: {
  values: number[]
  positive?: boolean
  width?: number
  height?: number
}) {
  const id = React.useId()
  const gradId = `spark-fill-${id}`

  const { linePath, areaPath } = React.useMemo(() => {
    if (!values.length) return { linePath: "", areaPath: "" }
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const step = width / Math.max(values.length - 1, 1)
    const points = values.map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * height
      return [x, y] as const
    })
    const line = points
      .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
      .join(" ")
    const area = `${line} L ${width} ${height} L 0 ${height} Z`
    return { linePath: line, areaPath: area }
  }, [values, width, height])

  const stroke = positive ? "rgb(2,76,199)" : "rgb(220,38,38)"
  const fillStart = positive ? "rgba(2,76,199,0.18)" : "rgba(220,38,38,0.18)"

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fillStart} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
