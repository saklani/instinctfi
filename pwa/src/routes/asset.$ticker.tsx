import * as React from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ShieldAlert, Lock } from "lucide-react"

import { useStockByTicker, useStockPrices } from "@/features/stocks"
import type { StockPricePoint } from "@/features/stocks"
import { useJupiterTokens } from "@/hooks/use-jupiter-tokens"
import type { JupiterTokenInfo } from "@/hooks/use-jupiter-tokens"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import { Skeleton } from "@/components/ui/skeleton"
import { Ticker as TickerPill, Verified } from "@/components/ui/pill"
import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  NavChart,
  NavChartSkeleton,
  type ChartPoint,
} from "@/components/chart/nav-chart"
import { Ticker } from "@/components/motion"

export const Route = createFileRoute("/asset/$ticker")({
  component: AssetDetailPage,
})

const PERIODS = [
  { id: "1W", days: 7 },
  { id: "1M", days: 30 },
  { id: "3M", days: 90 },
  { id: "1Y", days: 365 },
  { id: "5Y", days: 1825 },
] as const

type PeriodId = (typeof PERIODS)[number]["id"]

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

function AssetDetailPage() {
  const { ticker } = Route.useParams()
  const { stock, loading: stockLoading, error: stockError } = useStockByTicker(ticker)
  const [period, setPeriod] = React.useState<PeriodId>("1M")

  const days = PERIODS.find((p) => p.id === period)?.days ?? 30
  const { prices, loading: pricesLoading } = useStockPrices(stock?.id, days)

  const mints = React.useMemo(() => (stock ? [stock.address] : []), [stock])
  const { tokens, loading: tokensLoading } = useJupiterTokens(mints)
  const token = stock ? tokens[stock.address] : undefined

  if (stockLoading) return <DetailSkeleton />

  if (stockError || !stock) {
    return (
      <Column className="items-center text-center">
        <p>{stockError ?? "Stock not found"}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back to Discover</Link>
        </Button>
      </Column>
    )
  }

  return (
    <Column className="animate-in fade-in-0 duration-300 gap-12 pt-12 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        {/* LEFT */}
        <Column className="min-w-0">
          <AssetHeader stock={stock} token={token} />
          <hr className="border-border" />

          <PriceChart
            prices={prices}
            loading={pricesLoading}
            period={period}
            onPeriodChange={setPeriod}
          />

          <StatGrid token={token} />

          {/* Mobile-only About */}
          <Column className="lg:hidden">
            <AboutCard description={stock.description} />
          </Column>
        </Column>

        {/* RIGHT */}
        <Column className="hidden lg:flex">
          <AboutCard description={stock.description} />
        </Column>
      </div>
    </Column>
  )
}

/* ------------------------------------------------------------------ */
/*  Header                                                            */
/* ------------------------------------------------------------------ */

function AssetHeader({
  stock,
  token,
}: {
  stock: { name: string; ticker: string; imageUrl: string }
  token: JupiterTokenInfo | undefined
}) {
  return (
    <Row className="items-start">
      <img
        src={stock.imageUrl}
        alt={`${stock.name} logo`}
        className="size-20 rounded-full bg-secondary object-cover md:size-20"
        loading="eager"
      />
      <Column className="min-w-0">
        <h1>{stock.name}</h1>
        <Row className="flex-wrap items-center">
          <TickerPill symbol={stock.ticker.toUpperCase()} />
          {token?.isVerified && <Verified label="Jupiter verified" />}
          {token && !token.freezeAuthority && (
            <span
              data-slot="trust-pill"
              className="inline-flex h-5 items-center rounded-full bg-secondary text-xs font-medium text-foreground"
              title="Mint authority cannot freeze your tokens"
            >
              <Lock className="size-3 text-accent" aria-hidden />
              <span className="uppercase tracking-wider">Mint locked</span>
            </span>
          )}
          {token?.audit.isSus && (
            <span
              data-slot="trust-pill"
              className="inline-flex h-5 items-center rounded-full bg-destructive/10 text-xs font-medium text-destructive"
            >
              <ShieldAlert className="size-3" aria-hidden />
              <span className="uppercase tracking-wider">Flagged</span>
            </span>
          )}
        </Row>
      </Column>
    </Row>
  )
}

/* ------------------------------------------------------------------ */
/*  Price block                                                       */
/* ------------------------------------------------------------------ */

function PriceBlock({
  token,
  loading,
}: {
  token: JupiterTokenInfo | undefined
  loading: boolean
}) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const value = token?.usdPrice ?? null
  const change = token?.stats24h?.priceChange ?? null

  return (
    <Column>
      <p>Spot price</p>
      <Row className="flex-wrap items-baseline">
        {loading || value == null ? (
          <Skeleton className="h-10 w-32 rounded-sm" />
        ) : (
          <h2>
            <Ticker value={value} decimals={2} prefix="$" />
          </h2>
        )}
        <Delta value={change} size="lg" suffix="24h" asPercent />
      </Row>
      <p>{today}</p>
    </Column>
  )
}

/* ------------------------------------------------------------------ */
/*  Chart                                                             */
/* ------------------------------------------------------------------ */

function PriceChart({
  prices,
  loading,
  period,
  onPeriodChange,
}: {
  prices: StockPricePoint[]
  loading: boolean
  period: PeriodId
  onPeriodChange: (v: PeriodId) => void
}) {
  const data: ChartPoint[] = React.useMemo(
    () =>
      prices.map((p) => ({
        date: p.date,
        value: Number(p.close),
      })),
    [prices],
  )

  const selector = (
    <Tabs
      value={period}
      onValueChange={(v) => onPeriodChange(v as PeriodId)}
    >
      <TabsList variant="line">
        {PERIODS.map((p) => (
          <TabsTrigger key={p.id} value={p.id}>
            {p.id}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )

  if (loading && !data.length) {
    return <NavChartSkeleton height={320} />
  }

  if (!data.length) {
    return (
      <Column>
        <Row
          className="items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground"
          style={{ height: 320 }}
        >
          Chart unavailable
        </Row>
        <Row>{selector}</Row>
      </Column>
    )
  }

  return (
    <NavChart
      data={data}
      periodKey={period}
      periodSelector={selector}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Stat grid                                                         */
/* ------------------------------------------------------------------ */

function StatGrid({ token }: { token: JupiterTokenInfo | undefined }) {
  const volume24h =
    token?.stats24h?.buyVolume != null && token.stats24h.sellVolume != null
      ? Number(token.stats24h.buyVolume) + Number(token.stats24h.sellVolume)
      : null

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-md bg-border md:grid-cols-5">
      <Stat label="Spot price" value={token?.usdPrice ?? null} format="usd" />
      <Stat label="Liquidity" value={token?.liquidity ?? null} format="usd" compact />
      <Stat label="Holders" value={token?.holderCount ?? null} format="count" compact />
      <Stat label="24h Volume" value={volume24h} format="usd" compact />
      <Stat label="Market Cap" value={token?.mcap ?? null} format="usd" compact />
    </div>
  )
}

function Stat({
  label,
  value,
  format,
  compact,
}: {
  label: string
  value: number | null
  format: "usd" | "count"
  compact?: boolean
}) {
  return (
    <Column className="bg-card">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <MonoNumber
        value={value}
        format={format}
        compact={compact}
        size="md"
        className="text-foreground"
      />
    </Column>
  )
}

/* ------------------------------------------------------------------ */
/*  About                                                             */
/* ------------------------------------------------------------------ */

function AboutCard({ description }: { description: string | null }) {
  const text = description ?? "No description available."
  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{text}</p>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                          */
/* ------------------------------------------------------------------ */

function DetailSkeleton() {
  return (
    <Column className="gap-12 pt-12 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Column>
          <Row className="items-start">
            <Skeleton className="size-20 rounded-full" />
            <Column className="flex-1">
              <Skeleton className="h-9 w-2/3 rounded-sm" />
              <Skeleton className="h-6 w-1/3 rounded-sm" />
            </Column>
          </Row>
          <Column>
            <Skeleton className="h-3 w-24 rounded-sm" />
            <Skeleton className="h-10 w-40 rounded-sm" />
          </Column>
          <NavChartSkeleton height={320} />
          <div className="grid grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-sm" />
            ))}
          </div>
          <Skeleton className="h-32 rounded-md" />
        </Column>
        <Card className="hidden lg:block">
          <Skeleton className="h-24 rounded-sm" />
        </Card>
      </div>
    </Column>
  )
}
