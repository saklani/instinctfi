import * as React from "react"
import { Link } from "@tanstack/react-router"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
import { Row } from "@/components/ui/row"
import { Skeleton } from "@/components/ui/skeleton"
import { toTitleCase } from "@/lib/format"
import type { VaultResponse as Vault } from "../hooks/use-vaults"
import { useVaultNav } from "../hooks/use-vault-nav"
import { durations, outQuart } from "@/components/motion"

export type FeaturedKind = "trending" | "top-24h" | "newest"

type FeaturedCardProps = {
  vault: Vault
  nav: number
  delta: number
  kind?: FeaturedKind
  className?: string
}

export function FeaturedCard({
  vault,
  nav,
  delta,
  className,
}: FeaturedCardProps) {
  const { series } = useVaultNav(vault.id, 30)
  const spark = series.length > 0 ? series.map((p) => p.value) : [nav || 100]
  const holdingCount = vault.compositions?.length ?? 0
  return (
    <Link
      to="/fund/$id"
      params={{ id: vault.id }}
      className={cn(
        "block h-full rounded-xl outline-none focus-visible:ring-[4px] focus-visible:ring-accent/30",
        className,
      )}
    >
      <Card
        interactive
        className="relative h-full justify-between gap-5 pt-0 pb-6"
      >
        <FeaturedCover vault={vault} />

        <div className="flex flex-col gap-3 px-6">
          <h3 className="line-clamp-2 text-2xl font-semibold tracking-tight font-semibold leading-[1.05] tracking-tight text-foreground">
            {toTitleCase(vault.name)}
          </h3>
          <HoldingStack vault={vault} count={holdingCount} />
        </div>

        <Sparkline values={spark} positive={delta >= 0} />

        <div className="flex items-end justify-between gap-4 px-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground/70">NAV</span>
            <MonoNumber
              value={nav}
              format="usd"
              precision={2}
              size="md"
              className="text-foreground"
            />
          </div>
          <Delta value={delta} size="lg" suffix="24h" />
        </div>
      </Card>
    </Link>
  )
}

function HoldingStack({ vault, count }: { vault: Vault; count: number }) {
  const visible = vault.compositions?.slice(0, 6) ?? []
  const overflow = Math.max(0, count - visible.length)
  return (
    <div className="flex items-center gap-2">
      <Row className="gap-0 -space-x-1.5">
        {visible.map((c) => (
          <img
            key={c.stock.id}
            src={c.stock.imageUrl}
            alt={c.stock.ticker}
            title={c.stock.ticker}
            loading="lazy"
            className="size-6 rounded-full bg-secondary object-cover ring-2 ring-card"
          />
        ))}
        {overflow > 0 && (
          <span className="z-10 inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium tabular text-muted-foreground ring-2 ring-card">
            +{overflow}
          </span>
        )}
      </Row>
      <span className="text-xs text-muted-foreground/70">
        {count} holdings
      </span>
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

  const stroke = positive ? "var(--positive)" : "var(--destructive)"

  if (!linePath) {
    return (
      <div
        aria-hidden
        className="h-16 w-full rounded-sm bg-muted/40"
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

function FeaturedCover({ vault }: { vault: Vault }) {
  if (vault.imageUrl) {
    return (
      <img
        src={vault.imageUrl}
        alt={`${vault.name} cover`}
        loading="lazy"
        className="aspect-[16/9] w-full object-cover"
      />
    )
  }

  const monogram = vault.name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div
      aria-hidden
      className="relative aspect-[16/9] w-full overflow-hidden bg-secondary"
    >
      <span className="absolute inset-0 flex items-center justify-center font-heading text-4xl font-semibold tracking-tight text-muted-foreground/60">
        {monogram}
      </span>
    </div>
  )
}

export function FeaturedCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      data-slot="featured-card-skeleton"
      className={cn("relative h-full justify-between gap-5 pt-0 pb-6", className)}
    >
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="flex flex-col gap-3 px-6">
        <Skeleton className="h-7 w-3/4 rounded-sm" />
        <Skeleton className="h-5 w-1/2 rounded-sm" />
        <Row className="items-center gap-2">
          <Row className="gap-0 -space-x-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="size-6 rounded-full ring-2 ring-card"
              />
            ))}
          </Row>
          <Skeleton className="h-3 w-20 rounded-sm" />
        </Row>
      </div>
      <Skeleton className="h-16 w-full rounded-sm" />
      <div className="flex items-end justify-between gap-4 px-6">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-8 rounded-sm" />
          <Skeleton className="h-5 w-20 rounded-sm" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </Card>
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
