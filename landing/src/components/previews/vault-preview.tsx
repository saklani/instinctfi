import * as React from "react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

type Vault = {
  name: string
  icon: string
  holdings: { ticker: string; src: string }[]
  spark: number[]
  navUsd: number
  delta24h: number
}

const VAULTS: Vault[] = [
  {
    name: "Bald Founder Index",
    icon: "https://ik.imagekit.io/8dj2mc8pj/bald_founder_index.png",
    holdings: [
      { ticker: "AMZNx", src: "https://ik.imagekit.io/8dj2mc8pj/AMZNx.png" },
      { ticker: "COINx", src: "https://ik.imagekit.io/8dj2mc8pj/COINx.png" },
      { ticker: "MSFTx", src: "https://ik.imagekit.io/8dj2mc8pj/MSFTx.png" },
      { ticker: "GLXYx", src: "https://ik.imagekit.io/8dj2mc8pj/GLXYx.png" },
    ],
    spark: [100, 102, 99, 104, 108, 106, 112, 115, 113, 119, 124, 122, 128, 132, 130, 138, 144, 141, 149, 156],
    navUsd: 1.56,
    delta24h: 4.21,
  },
  {
    name: "Reverse Chamath",
    icon: "https://ik.imagekit.io/8dj2mc8pj/reverse_chamath.png",
    holdings: [],
    spark: [],
    navUsd: 0,
    delta24h: 0,
  },
  {
    name: "Bryan Johnson Blueprint",
    icon: "https://ik.imagekit.io/8dj2mc8pj/bryan_johnson_blueprint.png",
    holdings: [],
    spark: [],
    navUsd: 0,
    delta24h: 0,
  },
]

const PEEK_HEIGHT = 68
const PEEK_INSET = 14

type VaultPreviewProps = {
  className?: string
  navUsd?: number
  delta24h?: number
  spark?: number[]
}

export function VaultPreview({ className, navUsd, delta24h, spark }: VaultPreviewProps) {
  const [defaultFront, ...behind] = VAULTS
  const front: Vault = {
    ...defaultFront,
    navUsd: navUsd ?? defaultFront.navUsd,
    delta24h: delta24h ?? defaultFront.delta24h,
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
            <div className="flex h-20 items-center gap-3 rounded-2xl bg-card px-6 ring-1 ring-foreground/10">
              <img
                src={v.icon}
                alt=""
                className="size-10 rounded-full bg-secondary object-cover ring-1 ring-black/5"
              />
              <span className="truncate text-2xl font-semibold leading-[1.05] tracking-tight text-foreground">
                {v.name}
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
          <div className="flex items-center gap-3">
            <img
              src={front.icon}
              alt={front.name}
              className="size-10 rounded-full bg-secondary object-cover ring-1 ring-black/5"
            />
            <h3 className="line-clamp-2 text-2xl font-semibold leading-[1.05] tracking-tight text-foreground">
              {front.name}
            </h3>
          </div>
          <HoldingStack holdings={front.holdings} />
        </div>

        <Sparkline values={front.spark} positive={front.delta24h >= 0} />

        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground/70">NAV</span>
            <span className="font-mono text-xl tabular-nums text-foreground">
              ${front.navUsd.toFixed(2)}
            </span>
          </div>
          <Delta value={front.delta24h} />
        </div>
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
            loading="lazy"
            className="size-6 rounded-full bg-secondary object-cover ring-2 ring-card"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground/70">{holdings.length} holdings</span>
    </div>
  )
}

function Delta({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 rounded-md px-2 py-1 text-sm font-medium tabular-nums",
        positive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600",
      )}
    >
      <span>{positive ? "+" : ""}{value.toFixed(2)}%</span>
      <span className="text-xs text-muted-foreground/70">24h</span>
    </span>
  )
}

function Sparkline({
  values,
  positive = true,
  width = 320,
  height = 56,
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
