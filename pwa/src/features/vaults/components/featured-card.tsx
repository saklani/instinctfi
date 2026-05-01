import * as React from "react"
import { Link } from "@tanstack/react-router"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
import { Ticker } from "@/components/ui/pill"
import { durations, outQuart } from "@/components/motion/easings"
import type { Vault } from "../api"

export type FeaturedKind = "trending" | "top-24h" | "newest"

const KIND_LABEL: Record<FeaturedKind, string> = {
  trending: "Trending",
  "top-24h": "Top performer · 24h",
  newest: "Newest",
}

type FeaturedCardProps = {
  vault: Vault
  kind: FeaturedKind
  ticker: string
  nav: number
  delta: number
  /** 16+ values, ascending in time. Cobalt stroke renders proportional. */
  spark: number[]
  className?: string
}

export function FeaturedCard({
  vault,
  kind,
  ticker,
  nav,
  delta,
  spark,
  className,
}: FeaturedCardProps) {
  return (
    <Link
      to="/fund/$id"
      params={{ id: vault.id }}
      className={cn("block h-full", className)}
    >
      <Card
        interactive
        className="relative h-full justify-between gap-5 p-6"
      >
        <FeaturedHeader kind={kind} />

        <div className="flex flex-col gap-2">
          <h3 className="line-clamp-2 text-display-md font-semibold leading-[1.05] tracking-tight text-ink">
            {vault.name}
          </h3>
          <div className="flex items-center gap-2">
            <Ticker symbol={ticker} />
            <span className="text-body-sm text-ink-faint">
              {vault.compositions?.length ?? 0} holdings
            </span>
          </div>
        </div>

        <Sparkline values={spark} positive={delta >= 0} />

        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-pill text-ink-faint">NAV</span>
            <MonoNumber
              value={nav}
              format="usd"
              precision={2}
              size="md"
              className="text-ink"
            />
          </div>
          <Delta value={delta} size="lg" suffix="24h" />
        </div>
      </Card>
    </Link>
  )
}

function FeaturedHeader({ kind }: { kind: FeaturedKind }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          kind === "trending" && "bg-accent",
          kind === "top-24h" && "bg-positive",
          kind === "newest" && "bg-ink",
        )}
      />
      <span className="text-pill text-ink-muted">{KIND_LABEL[kind]}</span>
    </div>
  )
}

type SparklineProps = {
  values: number[]
  positive?: boolean
  width?: number
  height?: number
}

function Sparkline({
  values,
  positive = true,
  width = 320,
  height = 64,
}: SparklineProps) {
  const reduce = useReducedMotion()
  const id = React.useId()
  const gradId = `spark-fill-${id}`

  const { linePath, areaPath } = React.useMemo(
    () => buildSparkPaths(values, width, height),
    [values, width, height],
  )

  const stroke = positive ? "var(--accent)" : "var(--negative)"

  if (!linePath) {
    return (
      <div
        aria-hidden
        className="h-16 w-full rounded-tag bg-surface-muted/40"
      />
    )
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block h-16 w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <motion.path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={reduce ? undefined : { pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: durations.chartLine, ease: outQuart },
          opacity: { duration: 0.18 },
        }}
      />
    </svg>
  )
}

function buildSparkPaths(values: number[], width: number, height: number) {
  if (!values.length) return { linePath: "", areaPath: "" }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const padY = 4
  const usableH = height - padY * 2
  const stepX = values.length > 1 ? width / (values.length - 1) : width

  const points = values.map((v, i) => {
    const x = i * stepX
    const y = padY + (1 - (v - min) / span) * usableH
    return [x, y] as const
  })

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ")

  const areaPath =
    `${linePath} L${points[points.length - 1][0].toFixed(2)} ${height} ` +
    `L${points[0][0].toFixed(2)} ${height} Z`

  return { linePath, areaPath }
}
