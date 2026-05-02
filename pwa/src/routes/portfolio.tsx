import * as React from "react"
import { Link, createFileRoute } from "@tanstack/react-router"

import { useVaults } from "@/features/vaults"
import type { Vault } from "@/features/vaults/api"
import { usePositions } from "@/features/positions"
import { useOrders } from "@/features/orders"
import {
  HoldingRow,
  HoldingTableHeader,
  type HoldingRowData,
} from "@/features/positions/components/holding-row"
import {
  ActivityRow,
  ActivityTableHeader,
  type ActivityRowData,
} from "@/features/orders/components/activity-row"
import { useWallet } from "@/hooks/use-wallet"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Delta } from "@/components/ui/delta"
import { TabPill, TabPillItem } from "@/components/ui/tab-pill"
import { Reveal } from "@/components/motion/reveal"
import { Stagger } from "@/components/motion/stagger"
import { Ticker } from "@/components/motion/ticker"
import { NavChart, type ChartPoint } from "@/components/chart/nav-chart"
import { PortfolioEmpty } from "@/components/portfolio-empty"

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
})

const PERIODS = [
  { id: "1W", days: 7 },
  { id: "1M", days: 30 },
  { id: "3M", days: 90 },
  { id: "1Y", days: 365 },
  { id: "ALL", days: 730 },
] as const

type PeriodId = (typeof PERIODS)[number]["id"]
type DeltaWindow = "24h" | "all"
type PortfolioTab = "holdings" | "activity"

function PortfolioPage() {
  const { ready, authenticated, login } = useWallet()
  const { positions, loading: positionsLoading } = usePositions()
  const { orders, loading: ordersLoading } = useOrders()
  const { vaults, loading: vaultsLoading } = useVaults()

  const [period, setPeriod] = React.useState<PeriodId>("1Y")
  const [deltaWindow, setDeltaWindow] = React.useState<DeltaWindow>("24h")
  const [tab, setTab] = React.useState<PortfolioTab>("holdings")

  if (!ready) {
    return <PortfolioSkeleton />
  }

  if (!authenticated) {
    return <PortfolioConnect onConnect={login} />
  }

  const loading = positionsLoading || vaultsLoading
  const holdings = buildHoldings(positions, vaults)
  const totals = computeTotals(holdings)
  const chartData = buildPortfolioSeries(
    holdings,
    PERIODS.find((p) => p.id === period)?.days ?? 365,
  )
  const sortedActivity: ActivityRowData[] = orders
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((order) => ({
      order,
      vaultName: vaults.find((v) => v.id === order.vaultId)?.name ?? null,
    }))

  const isEmpty =
    !loading && holdings.length === 0 && sortedActivity.length === 0

  if (isEmpty) {
    return (
      <Reveal as="div">
        <PortfolioEmpty />
      </Reveal>
    )
  }

  return (
    <Reveal as="div" className="flex flex-col gap-10 lg:gap-12">
      <PortfolioHero
        totalValue={totals.totalValue}
        delta24h={totals.delta24h}
        deltaAllTime={totals.deltaAllTime}
        deltaWindow={deltaWindow}
        onDeltaWindowChange={setDeltaWindow}
        loading={loading}
      />

      <PortfolioChart
        data={chartData}
        period={period}
        onPeriodChange={setPeriod}
        loading={loading}
      />

      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between gap-3 px-4">
          <TabPill
            value={tab}
            onValueChange={(v) => setTab(v as PortfolioTab)}
            layoutId="portfolio-tabs"
            className="bg-surface-muted"
          >
            <TabPillItem value="holdings">Holdings</TabPillItem>
            <TabPillItem value="activity">Activity</TabPillItem>
          </TabPill>
          <span className="font-mono text-mono-sm tabular text-ink-faint">
            {tab === "holdings"
              ? holdings.length === 1
                ? "1 holding"
                : `${holdings.length} holdings`
              : sortedActivity.length === 1
                ? "1 event"
                : `${sortedActivity.length} events`}
          </span>
        </header>

        {tab === "holdings" ? (
          <HoldingsView holdings={holdings} loading={loading} />
        ) : (
          <ActivityView
            rows={sortedActivity}
            loading={ordersLoading}
          />
        )}
      </section>
    </Reveal>
  )
}

// ---------- HERO ----------

type PortfolioHeroProps = {
  totalValue: number
  delta24h: number | null
  deltaAllTime: number | null
  deltaWindow: DeltaWindow
  onDeltaWindowChange: (next: DeltaWindow) => void
  loading: boolean
}

function PortfolioHero({
  totalValue,
  delta24h,
  deltaAllTime,
  deltaWindow,
  onDeltaWindowChange,
  loading,
}: PortfolioHeroProps) {
  const activeDelta = deltaWindow === "24h" ? delta24h : deltaAllTime
  return (
    <section
      data-slot="portfolio-hero"
      className="flex flex-col gap-4 px-4 pt-2 lg:pt-6"
    >
      <span className="text-pill text-ink-faint">Portfolio</span>
      <div className="flex flex-col gap-3">
        <span className="text-body-sm uppercase tracking-[0.06em] text-ink-faint">
          Total Value
        </span>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          {loading ? (
            <Skeleton className="h-12 w-56" />
          ) : (
            <Ticker
              value={totalValue}
              decimals={2}
              prefix="$"
              className="text-mono-xl font-medium text-ink"
            />
          )}
          <Delta
            value={activeDelta}
            size="lg"
            suffix={deltaWindow === "24h" ? "24h" : "all time"}
          />
        </div>
      </div>
      <TabPill
        value={deltaWindow}
        onValueChange={(v) => onDeltaWindowChange(v as DeltaWindow)}
        layoutId="portfolio-period-toggle"
        className="bg-surface-muted self-start"
      >
        <TabPillItem value="24h">24h</TabPillItem>
        <TabPillItem value="all">All time</TabPillItem>
      </TabPill>
    </section>
  )
}

// ---------- CHART ----------

type PortfolioChartProps = {
  data: ChartPoint[]
  period: PeriodId
  onPeriodChange: (next: PeriodId) => void
  loading: boolean
}

function PortfolioChart({
  data,
  period,
  onPeriodChange,
  loading,
}: PortfolioChartProps) {
  if (loading) {
    return (
      <div className="px-4">
        <Skeleton className="h-[280px] w-full rounded-tag md:h-[320px]" />
      </div>
    )
  }
  if (data.length === 0) {
    return null
  }
  return (
    <div className="px-4">
      <NavChart
        data={data}
        periodKey={period}
        periodSelector={
          <TabPill
            value={period}
            onValueChange={(v) => onPeriodChange(v as PeriodId)}
            layoutId="portfolio-chart-period"
            className="bg-canvas"
          >
            {PERIODS.map((p) => (
              <TabPillItem key={p.id} value={p.id}>
                {p.id}
              </TabPillItem>
            ))}
          </TabPill>
        }
      />
    </div>
  )
}

// ---------- HOLDINGS / ACTIVITY ----------

function HoldingsView({
  holdings,
  loading,
}: {
  holdings: HoldingRowData[]
  loading: boolean
}) {
  if (loading) {
    return <RowsSkeleton />
  }
  if (holdings.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-body-sm text-ink-muted">
        No holdings yet.{" "}
        <Link to="/" className="text-ink underline-offset-4 hover:underline">
          Browse vaults →
        </Link>
      </div>
    )
  }
  return (
    <div role="table" aria-label="Holdings" className="flex flex-col">
      <HoldingTableHeader />
      <Stagger
        gap={0.03}
        offset={6}
        role="rowgroup"
        className="flex flex-col divide-y divide-hairline"
      >
        {holdings.map((row) => (
          <Stagger.Item key={row.vaultId}>
            <HoldingRow row={row} />
          </Stagger.Item>
        ))}
      </Stagger>
    </div>
  )
}

function ActivityView({
  rows,
  loading,
}: {
  rows: ActivityRowData[]
  loading: boolean
}) {
  if (loading) {
    return <RowsSkeleton />
  }
  if (rows.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-body-sm text-ink-muted">
        No activity yet.
      </div>
    )
  }
  return (
    <div role="table" aria-label="Activity" className="flex flex-col">
      <ActivityTableHeader />
      <Stagger
        gap={0.03}
        offset={6}
        role="rowgroup"
        className="flex flex-col divide-y divide-hairline"
      >
        {rows.map((row) => (
          <Stagger.Item key={row.order.id}>
            <ActivityRow row={row} />
          </Stagger.Item>
        ))}
      </Stagger>
    </div>
  )
}

// ---------- AUTH / LOADING / SKELETON ----------

function PortfolioConnect({ onConnect }: { onConnect: () => void }) {
  return (
    <Reveal as="div" className="flex flex-col gap-6 px-4 pt-2 lg:pt-6">
      <span className="text-pill text-ink-faint">Portfolio</span>
      <h1 className="max-w-2xl text-display-md font-semibold tracking-tight text-ink lg:text-display-lg">
        Connect a wallet to see your holdings.
      </h1>
      <p className="max-w-md text-body text-ink-muted">
        Sign in with Privy to view total value, delta, and activity across your
        vault positions.
      </p>
      <Button onClick={onConnect} variant="primary" size="lg" className="self-start">
        Connect wallet
      </Button>
    </Reveal>
  )
}

function PortfolioSkeleton() {
  return (
    <div className="flex flex-col gap-10 lg:gap-12">
      <div className="flex flex-col gap-4 px-4 pt-2 lg:pt-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="px-4">
        <Skeleton className="h-[280px] w-full rounded-tag md:h-[320px]" />
      </div>
      <div className="px-4">
        <RowsSkeleton />
      </div>
    </div>
  )
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-hairline">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-4 flex-1 max-w-[280px]" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="hidden h-4 w-16 md:block" />
        </div>
      ))}
    </div>
  )
}

// ---------- DERIVATIONS (mock until Phase 8) ----------
//
// Positions only carry { id, vaultId, shares, amount }. NAV per share, 24h delta,
// and inception-to-now growth are not yet on-chain — Phase 8 (real-data) will
// replace these helpers. Until then, derive deterministically from vault.id seed
// (matches Discover & fund detail) so the same vault reads consistently across
// pages.

function seedFromString(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

const VAULT_TICKERS: Record<string, string> = {
  "pelosi tracker": "PELO",
  "anti finance finance club": "AFFC",
}

function tickerSymbolFor(vault: Vault | null): string | null {
  if (!vault) return null
  return VAULT_TICKERS[vault.name.trim().toLowerCase()] ?? null
}

function deriveDelta24h(seed: number) {
  return ((seed % 47) - 22) / 1000
}

function deriveAllTimeGrowth(seed: number) {
  // Inception-to-now drift, range roughly -10% to +30%.
  return ((seed % 41) - 10) / 100
}

function buildHoldings(
  positions: Array<{ vaultId: string; shares: string; amount: string }>,
  vaults: Vault[],
): HoldingRowData[] {
  return positions
    .map((p) => {
      const vault = vaults.find((v) => v.id === p.vaultId) ?? null
      const seed = seedFromString(p.vaultId)
      const invested = Number(p.amount) / 1e6
      const growth = deriveAllTimeGrowth(seed)
      const value = invested * (1 + growth)
      // Treat shares as already in UI units (divide by 1e6 if base units).
      const sharesNum = Number(p.shares)
      const units = sharesNum > 1e6 ? sharesNum / 1e6 : sharesNum
      return {
        vaultId: p.vaultId,
        vault,
        ticker: tickerSymbolFor(vault),
        units,
        value,
        delta24h: deriveDelta24h(seed),
      }
    })
    .sort((a, b) => b.value - a.value)
}

function computeTotals(holdings: HoldingRowData[]) {
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
  if (totalValue === 0) {
    return { totalValue: 0, delta24h: null, deltaAllTime: null }
  }
  const delta24h = holdings.reduce(
    (sum, h) => sum + (h.delta24h ?? 0) * (h.value / totalValue),
    0,
  )
  // Total invested ≈ sum(value / (1 + growth)). All-time delta = (totalValue - invested) / invested.
  const totalInvested = holdings.reduce((sum, h) => {
    const seed = seedFromString(h.vaultId)
    const growth = deriveAllTimeGrowth(seed)
    return sum + h.value / (1 + growth)
  }, 0)
  const deltaAllTime =
    totalInvested > 0 ? (totalValue - totalInvested) / totalInvested : null
  return { totalValue, delta24h, deltaAllTime }
}

function buildPortfolioSeries(
  holdings: HoldingRowData[],
  periodDays: number,
): ChartPoint[] {
  if (!holdings.length) return []
  const points: ChartPoint[] = []
  const today = new Date()
  const stepDays = periodDays > 365 ? 7 : periodDays > 90 ? 2 : 1
  const seedSum = holdings.reduce(
    (acc, h) => acc + seedFromString(h.vaultId),
    1,
  )
  const totalValue = holdings.reduce((s, h) => s + h.value, 0) || 1
  const baseline = Math.max(20, totalValue * 0.86)
  let drift = 0
  for (let i = periodDays; i >= 0; i -= stepDays) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const phase = ((periodDays - i) / Math.max(stepDays, 1)) * 0.18
    drift +=
      Math.sin(phase + (seedSum % 7)) * 0.6 +
      Math.cos(phase * 1.7 + (seedSum % 11)) * 0.35
    const noise = (((seedSum * (i + 1)) % 13) - 6) * 0.1
    const progress = (periodDays - i) / Math.max(periodDays, 1)
    const ramp = baseline + (totalValue - baseline) * progress
    const value = ramp + drift * (totalValue * 0.012) + noise
    points.push({
      date: d.toISOString().slice(0, 10),
      value: Number(Math.max(0, value).toFixed(2)),
    })
  }
  return points
}
