import * as React from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ShieldAlert, ShieldCheck, Lock } from "lucide-react"

import { useStockByTicker, useStockPrices } from "@/features/stocks"
import type { StockPricePoint } from "@/features/stocks"
import { useJupiterTokens } from "@/hooks/use-jupiter-tokens"
import type { JupiterTokenInfo } from "@/hooks/use-jupiter-tokens"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import { Skeleton } from "@/components/ui/skeleton"
import { Ticker as TickerPill, Verified } from "@/components/ui/pill"
import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
import { TabPill, TabPillItem } from "@/components/ui/tab-pill"
import {
  NavChart,
  NavChartSkeleton,
  type ChartPoint,
} from "@/components/chart/nav-chart"
import { Reveal, Ticker } from "@/components/motion"

export const Route = createFileRoute("/asset/$ticker")({
  component: AssetDetailPage,
})

const PERIODS = [
  { id: "1W", days: 7 },
  { id: "1M", days: 30 },
  { id: "3M", days: 90 },
  { id: "1Y", days: 365 },
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
    <Reveal as="div" className="flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* LEFT */}
        <Column className="min-w-0">
          <AssetHeader stock={stock} token={token} />
          <hr className="border-border" />

          <PriceBlock token={token} loading={tokensLoading} />

          <PriceChart
            prices={prices}
            loading={pricesLoading}
            period={period}
            onPeriodChange={setPeriod}
          />

          <StatGrid token={token} />

          <TrustSection token={token} loading={tokensLoading} />

          {/* Mobile-only About */}
          <Column className="lg:hidden">
            <AboutCard description={stock.description} />
          </Column>
        </Column>

        {/* RIGHT */}
        <aside className="hidden flex-col lg:flex">
          <AboutCard description={stock.description} />
        </aside>
      </div>
    </Reveal>
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
    <header className="flex flex-col md:flex-row md:items-start md:justify-between">
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
    </header>
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
      <span className="text-xs text-muted-foreground">Spot price</span>
      <Row className="flex-wrap items-baseline">
        {loading || value == null ? (
          <Skeleton className="h-10 w-32 rounded-sm" />
        ) : (
          <Ticker
            value={value}
            decimals={2}
            prefix="$"
            className="font-mono text-2xl tabular-nums font-medium text-foreground"
          />
        )}
        <Delta value={change} size="lg" suffix="24h" asPercent />
      </Row>
      <span className="font-mono text-xs tabular-nums text-muted-foreground/70">
        {today}
      </span>
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
    <TabPill
      value={period}
      onValueChange={(v) => onPeriodChange(v as PeriodId)}
      layoutId="asset-time-pill"
      className="bg-background"
    >
      {PERIODS.map((p) => (
        <TabPillItem key={p.id} value={p.id}>
          {p.id}
        </TabPillItem>
      ))}
    </TabPill>
  )

  if (loading && !data.length) {
    return <NavChartSkeleton height={320} />
  }

  if (!data.length) {
    return (
      <Column>
        <div
          className="flex items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground"
          style={{ height: 320 }}
        >
          Chart unavailable
        </div>
        <div className="flex">{selector}</div>
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
    <section className="grid grid-cols-2 overflow-hidden rounded-md bg-border md:grid-cols-4">
      <Stat label="Liquidity" value={token?.liquidity ?? null} format="usd" compact />
      <Stat label="Holders" value={token?.holderCount ?? null} format="count" compact />
      <Stat label="24h Volume" value={volume24h} format="usd" compact />
      <Stat label="Market Cap" value={token?.mcap ?? null} format="usd" compact />
    </section>
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
/*  Trust section                                                     */
/* ------------------------------------------------------------------ */

function TrustSection({
  token,
  loading,
}: {
  token: JupiterTokenInfo | undefined
  loading: boolean
}) {
  if (loading && !token) {
    return (
      <section className="flex flex-col">
        <h2>On-chain trust</h2>
        <Skeleton className="h-24 rounded-md" />
      </section>
    )
  }

  if (!token) return null

  return (
    <section className="flex flex-col">
      <Row className="items-baseline justify-between">
        <h2>On-chain trust</h2>
        <span className="font-mono text-xs tabular-nums text-muted-foreground/70">
          via Jupiter
        </span>
      </Row>

      <Column className="rounded-md border border-border bg-card">
        <ScoreBar score={token.organicScore} label={token.organicScoreLabel} />

        <hr className="border-border" />

        <AuditRow token={token} />

        {token.tags.length > 0 && (
          <>
            <hr className="border-border" />
            <TagRow tags={token.tags} />
          </>
        )}
      </Column>
    </section>
  )
}

function ScoreBar({
  score,
  label,
}: {
  score: number
  label: "low" | "medium" | "high"
}) {
  const pct = Math.max(0, Math.min(100, score))
  const tone =
    label === "high"
      ? "bg-positive"
      : label === "medium"
        ? "bg-amber-500"
        : "bg-destructive"

  return (
    <Column>
      <Row className="items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Organic score</span>
        <Row className="items-baseline">
          <MonoNumber value={score} format="raw" precision={0} size="md" />
          <span
            className={cn(
              "rounded-full text-[10px] uppercase tracking-wider",
              label === "high" && "bg-positive/10 text-positive",
              label === "medium" && "bg-amber-500/10 text-amber-600",
              label === "low" && "bg-destructive/10 text-destructive",
            )}
          >
            {label}
          </span>
        </Row>
      </Row>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-muted-foreground/70">
        Filters bot activity and wash trading. Higher is better.
      </span>
    </Column>
  )
}

function AuditRow({ token }: { token: JupiterTokenInfo }) {
  const items: Array<{ key: string; label: string; value: React.ReactNode }> = []

  if (token.audit.topHoldersPercentage != null) {
    items.push({
      key: "topHolders",
      label: "Top holders",
      value: (
        <MonoNumber
          value={token.audit.topHoldersPercentage}
          format="pct"
          precision={1}
          size="sm"
        />
      ),
    })
  }

  if (token.audit.devBalancePercentage != null) {
    items.push({
      key: "devBalance",
      label: "Dev balance",
      value: (
        <MonoNumber
          value={token.audit.devBalancePercentage}
          format="pct"
          precision={2}
          size="sm"
        />
      ),
    })
  }

  if (token.audit.devMints != null) {
    items.push({
      key: "devMints",
      label: "Dev mints",
      value: (
        <MonoNumber value={token.audit.devMints} format="count" size="sm" />
      ),
    })
  }

  if (!items.length) return null

  return (
    <Column>
      <Row className="items-center">
        <ShieldCheck className="size-3.5 text-muted-foreground" aria-hidden />
        <span className="text-xs text-muted-foreground">Audit</span>
      </Row>
      <dl className="grid grid-cols-3">
        {items.map((it) => (
          <Column key={it.key}>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {it.label}
            </dt>
            <dd>{it.value}</dd>
          </Column>
        ))}
      </dl>
    </Column>
  )
}

function TagRow({ tags }: { tags: string[] }) {
  return (
    <Row className="flex-wrap">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex h-5 items-center rounded-full bg-secondary text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
        >
          {tag}
        </span>
      ))}
    </Row>
  )
}

/* ------------------------------------------------------------------ */
/*  About                                                             */
/* ------------------------------------------------------------------ */

function AboutCard({ description }: { description: string | null }) {
  const text = description ?? "No description available."
  return (
    <Card>
      <h2>About</h2>
      <p>{text}</p>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                          */
/* ------------------------------------------------------------------ */

function DetailSkeleton() {
  return (
    <Column>
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
