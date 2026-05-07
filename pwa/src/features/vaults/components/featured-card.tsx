import * as React from "react"
import { Link } from "@tanstack/react-router"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
import { Row } from "@/components/ui/row"
import { Skeleton } from "@/components/ui/skeleton"
import { toTitleCase } from "@/lib/format"
import type { VaultResponse as Vault } from "../hooks/use-vaults"
import { useSuspenseVault } from "../hooks/use-vault"
import { useSuspenseVaultNav } from "../hooks/use-vault-nav"
import { durations, outQuart } from "@/components/motion"

type FeaturedCardProps = {
  vaultId: string
  className?: string
}

export function FeaturedCard({ vaultId, className }: FeaturedCardProps) {
  const vault = useSuspenseVault(vaultId)

  const nav = vault.nav ?? 0
  const holdingCount = vault.compositions?.length ?? 0
  return (
    <Card interactive className={cn("relative h-full", className)}>
      <FeaturedCover vault={vault} />

      {/* Stretched click overlay — covers the card except where higher-z children intercept. */}
      <Link
        to="/fund/$id"
        params={{ id: vaultId }}
        aria-label={`View ${toTitleCase(vault.name)}`}
        className="absolute inset-0 z-10 rounded-xl outline-none focus-visible:ring-[4px] focus-visible:ring-accent/30"
      />

      <CardHeader>
        <CardTitle className="line-clamp-2">
          {toTitleCase(vault.name)}
        </CardTitle>
        <CardDescription>
          <HoldingStack vault={vault} count={holdingCount} />
        </CardDescription>
        <CardAction>
          <MonoNumber
            value={nav}
            format="usd"
            precision={2}
            size="md"
            className="text-foreground"
          />
        </CardAction>
      </CardHeader>

      <CardContent>
        <React.Suspense fallback={<NavChartSkeleton />}>
          <NavChart vaultId={vaultId} fallbackNav={nav} />
        </React.Suspense>
      </CardContent>

      <CardFooter className="justify-end">
        <React.Suspense fallback={<DeltaSkeleton />}>
          <DeltaChip vaultId={vaultId} />
        </React.Suspense>
      </CardFooter>
    </Card>
  )
}

function NavChart({
  vaultId,
  fallbackNav,
}: {
  vaultId: string
  fallbackNav: number
}) {
  const series = useSuspenseVaultNav(vaultId, 30)
  const spark =
    series.length > 0 ? series.map((p) => p.value) : [fallbackNav || 100]
  const delta30d =
    series.length > 1
      ? (series[series.length - 1].value - series[0].value) / series[0].value
      : 0
  return <Sparkline values={spark} positive={delta30d >= 0} />
}

function NavChartSkeleton() {
  return <Skeleton className="h-16 w-full rounded-sm" />
}

function DeltaChip({ vaultId }: { vaultId: string }) {
  const series = useSuspenseVaultNav(vaultId, 30)
  const delta30d =
    series.length > 1
      ? (series[series.length - 1].value - series[0].value) / series[0].value
      : null
  return <Delta value={delta30d} size="lg" suffix="30d" />
}

function DeltaSkeleton() {
  return <Skeleton className="h-6 w-16 rounded-full" />
}

function HoldingStack({ vault, count }: { vault: Vault; count: number }) {
  const visible = vault.compositions?.slice(0, 6) ?? []
  const overflow = Math.max(0, count - visible.length)
  return (
    <Row className="relative z-20 gap-0 -space-x-1.5 transition-all duration-200 has-[a:hover]:space-x-1">
      {visible.map((c) => (
        <Link
          key={c.stock.id}
          to="/asset/$ticker"
          params={{ ticker: c.stock.ticker }}
          aria-label={c.stock.ticker}
          title={c.stock.ticker}
          className="block rounded-full outline-none transition-all duration-200 hover:z-30 hover:scale-125 focus-visible:ring-[3px] focus-visible:ring-accent/30"
        >
          <img
            src={c.stock.imageUrl}
            alt=""
            loading="lazy"
            className="size-6 rounded-full bg-secondary object-cover ring-2 ring-card"
          />
        </Link>
      ))}
      {overflow > 0 && (
        <span className="z-10 inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium tabular text-muted-foreground ring-2 ring-card">
          +{overflow}
        </span>
      )}
    </Row>
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
      className={cn("h-full pt-0", className)}
    >
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-7 w-3/4 rounded-sm" />
        </CardTitle>
        <CardDescription>
          <Row className="gap-0 -space-x-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="size-6 rounded-full ring-2 ring-card"
              />
            ))}
          </Row>
        </CardDescription>
        <CardAction>
          <Skeleton className="h-5 w-16 rounded-sm" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <NavChartSkeleton />
      </CardContent>
      <CardFooter className="justify-end">
        <DeltaSkeleton />
      </CardFooter>
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
