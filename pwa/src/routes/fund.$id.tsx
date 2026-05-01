import * as React from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import {
  Bookmark,
  Camera,
  ChevronRight,
  MessageCircle,
  MoreHorizontal,
  Search,
  Share2,
} from "lucide-react"

import { useVault } from "@/features/vaults"
import { CompositionList } from "@/features/vaults/components/composition-list"
import { DepositPanel } from "@/features/vaults/components/deposit-panel"
import type { Vault } from "@/features/vaults/api"
import { usePendingOrders, OrderCard } from "@/features/orders"
import { useWallet } from "@/hooks/use-wallet"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Ticker as TickerPill, Count, Verified } from "@/components/ui/pill"
import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
import { TabPill, TabPillItem } from "@/components/ui/tab-pill"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Reveal } from "@/components/motion/reveal"
import { Stagger } from "@/components/motion/stagger"
import { Ticker } from "@/components/motion/ticker"
import { NavChart, type ChartPoint } from "@/components/chart/nav-chart"
import { StickyCta } from "@/components/sticky-cta"

export const Route = createFileRoute("/fund/$id")({
  component: FundDetailPage,
})

const PERIODS = [
  { id: "1W", days: 7 },
  { id: "1M", days: 30 },
  { id: "3M", days: 90 },
  { id: "1Y", days: 365 },
  { id: "ALL", days: 730 },
] as const

type PeriodId = (typeof PERIODS)[number]["id"]

function seedFromString(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function generateMockNavData(periodDays: number, seed: number): ChartPoint[] {
  const points: ChartPoint[] = []
  const today = new Date()
  const stepDays = periodDays > 365 ? 7 : periodDays > 90 ? 2 : 1
  const baseline = 100 + (seed % 50)
  let drift = 0
  for (let i = periodDays; i >= 0; i -= stepDays) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const phase = ((periodDays - i) / Math.max(stepDays, 1)) * 0.18
    drift +=
      Math.sin(phase + (seed % 7)) * 0.6 +
      Math.cos(phase * 1.7 + (seed % 11)) * 0.35
    const noise = (((seed * (i + 1)) % 13) - 6) * 0.1
    const value = baseline + drift * 1.4 + noise + (periodDays - i) * 0.02
    points.push({
      date: d.toISOString().slice(0, 10),
      value: Number(Math.max(20, value).toFixed(2)),
    })
  }
  return points
}

function deriveVaultStats(vault: Vault) {
  const seed = seedFromString(vault.id)
  return {
    tvl: 1_250_000 + (seed % 80) * 25_000,
    volume24h: 18_000 + (seed % 60) * 800,
    holders: 84 + (seed % 240),
    performanceFeeBps: 1000,
    managementFeeBps: 75,
    inception: "2024-08-12",
  }
}

function FundDetailPage() {
  const { id } = Route.useParams()
  const { vault, loading, error } = useVault(id)
  const { authenticated, login, ready } = useWallet()
  const { orders: pendingOrders } = usePendingOrders()
  const [period, setPeriod] = React.useState<PeriodId>("3M")
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const myPendingOrders = pendingOrders.filter((o) => o.vaultId === id)

  const seed = React.useMemo(() => (vault ? seedFromString(vault.id) : 0), [vault])
  const periodDays =
    PERIODS.find((p) => p.id === period)?.days ?? 90
  const chartData = React.useMemo(
    () => (vault ? generateMockNavData(periodDays, seed) : []),
    [vault, periodDays, seed],
  )

  if (loading) {
    return <DetailSkeleton />
  }

  if (error || !vault) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-body text-destructive">
          {error ?? "Vault not found"}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back to Discover</Link>
        </Button>
      </div>
    )
  }

  const stats = deriveVaultStats(vault)
  const navValue = chartData[chartData.length - 1]?.value ?? 100
  const navStart = chartData[0]?.value ?? navValue
  const navDelta = navStart > 0 ? (navValue - navStart) / navStart : 0
  const compositionItems = vault.compositions.map((c) => ({
    id: c.stock.id,
    ticker: c.stock.ticker,
    name: c.stock.name,
    logoUrl: c.stock.imageUrl,
    weightBps: c.weightBps,
    delta24h: ((seedFromString(c.stock.id) % 41) - 20) / 1000,
  }))

  const handleStickyCta = () => {
    if (!ready) return
    if (!authenticated) {
      login()
      return
    }
    setSheetOpen(true)
  }

  return (
    <>
      <Reveal as="div" className="flex flex-col gap-8">
        <Breadcrumb name={vault.name} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          {/* LEFT */}
          <div className="flex min-w-0 flex-col gap-8">
            <AssetHeader vault={vault} />
            <hr className="border-hairline" />
            <NavPriceBlock value={navValue} delta={navDelta} period={period} />
            <NavChart
              data={chartData}
              periodKey={period}
              periodSelector={
                <TabPill
                  value={period}
                  onValueChange={(v) => setPeriod(v as PeriodId)}
                  layoutId="time-pill"
                  className="bg-canvas"
                >
                  {PERIODS.map((p) => (
                    <TabPillItem key={p.id} value={p.id}>
                      {p.id}
                    </TabPillItem>
                  ))}
                </TabPill>
              }
              toolbar={
                <div className="flex items-center gap-1">
                  <Button
                    variant="icon"
                    size="icon-sm"
                    aria-label="Save chart snapshot"
                  >
                    <Camera />
                  </Button>
                  <Button
                    variant="icon"
                    size="icon-sm"
                    aria-label="Share chart"
                  >
                    <Share2 />
                  </Button>
                </div>
              }
            />

            <StatsSection stats={stats} vault={vault} />

            <CompositionSection items={compositionItems} />

            {authenticated && myPendingOrders.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-heading text-ink">Open orders</h2>
                {myPendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </section>
            )}

            {/* Mobile-only About + News (rendered in right column on desktop) */}
            <div className="flex flex-col gap-6 lg:hidden">
              <AboutCard description={vault.description} />
              <NewsList vault={vault} />
            </div>
          </div>

          {/* RIGHT */}
          <aside className="hidden flex-col gap-6 lg:flex">
            <div className="lg:sticky lg:top-24">
              <Card>
                <DepositPanel vault={vault} />
              </Card>
            </div>
            <AboutCard description={vault.description} />
            <NewsList vault={vault} />
          </aside>
        </div>
      </Reveal>

      {/* MOBILE sticky CTA + Sheet */}
      <StickyCta onClick={handleStickyCta} expandable>
        {!ready ? "Loading…" : !authenticated ? "Connect wallet" : "Deposit USDC"}
      </StickyCta>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            "rounded-t-card border-t border-hairline bg-canvas p-6",
            "pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]",
          )}
        >
          <SheetHeader className="p-0">
            <SheetTitle className="text-heading text-ink">
              {vault.name}
            </SheetTitle>
            <SheetDescription className="text-body-sm text-ink-muted">
              Deposit USDC, queue at next NAV print.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <DepositPanel vault={vault} onDone={() => setSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-body-sm text-ink-muted"
    >
      <Link to="/" className="hover:text-ink">
        Discover
      </Link>
      <ChevronRight className="size-3.5 text-ink-faint" aria-hidden />
      <span className="text-ink">{name}</span>
    </nav>
  )
}

function AssetHeader({ vault }: { vault: Vault }) {
  const tickerCount = vault.compositions?.length ?? 0
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
      <div className="flex items-start gap-4">
        <VaultLogo vault={vault} />
        <div className="flex min-w-0 flex-col gap-3">
          <h1 className="text-display-md font-semibold tracking-tight text-ink md:text-display-lg">
            {vault.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Verified label="Curated" />
            {tickerSymbolFor(vault) && (
              <TickerPill symbol={tickerSymbolFor(vault)!} />
            )}
            {tickerCount > 0 && (
              <Count interactive>{tickerCount} HOLDINGS</Count>
            )}
          </div>
        </div>
      </div>
      <HeaderActions />
    </header>
  )
}

function VaultLogo({ vault }: { vault: Vault }) {
  if (vault.imageUrl) {
    return (
      <img
        src={vault.imageUrl}
        alt={`${vault.name} logo`}
        className="size-20 rounded-full bg-secondary object-cover md:size-20"
        loading="eager"
      />
    )
  }
  // Stack first 3 holding logos in a circular cluster as fallback.
  const stocks = vault.compositions?.slice(0, 3) ?? []
  return (
    <div
      aria-hidden
      className="relative size-20 shrink-0 rounded-full bg-secondary"
    >
      {stocks.map((c, i) => (
        <img
          key={c.stock.id}
          src={c.stock.imageUrl}
          alt=""
          className="absolute size-10 rounded-full ring-2 ring-canvas"
          style={{
            top: i === 0 ? 4 : i === 1 ? 32 : 18,
            left: i === 0 ? 4 : i === 1 ? 38 : 22,
            zIndex: 3 - i,
          }}
        />
      ))}
      {stocks.length === 0 && (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-mono-md text-ink-muted">
          {vault.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-1 md:gap-1">
      <Button variant="icon" size="icon-sm" aria-label="Search vault detail">
        <Search />
      </Button>
      <Button variant="icon" size="icon-sm" aria-label="Share vault">
        <Share2 />
      </Button>
      <Button variant="icon" size="icon-sm" aria-label="Comments">
        <MessageCircle />
      </Button>
      <Button variant="icon" size="icon-sm" aria-label="Save vault">
        <Bookmark />
      </Button>
      <Button
        variant="icon"
        size="icon-sm"
        aria-label="More actions"
        className="md:hidden"
      >
        <MoreHorizontal />
      </Button>
    </div>
  )
}

const VAULT_TICKERS: Record<string, string> = {
  "pelosi tracker": "PELO",
  "anti finance finance club": "AFFC",
}

function tickerSymbolFor(vault: Vault): string | null {
  return VAULT_TICKERS[vault.name.trim().toLowerCase()] ?? null
}

function NavPriceBlock({
  value,
  delta,
  period,
}: {
  value: number
  delta: number
  period: PeriodId
}) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return (
    <div className="flex flex-col gap-2">
      <span className="text-body-sm text-ink-muted">NAV per share</span>
      <div className="flex flex-wrap items-baseline gap-3">
        <Ticker
          value={value}
          decimals={2}
          prefix="$"
          className="text-mono-xl font-medium text-ink"
        />
        <Delta value={delta} size="lg" suffix={period} />
      </div>
      <span className="font-mono text-mono-sm tabular text-ink-faint">
        {today}
      </span>
    </div>
  )
}

const STAT_LABEL_CLASS = "text-body-sm uppercase tracking-[0.06em] text-ink-faint"
const STAT_VALUE_CLASS = "font-mono text-mono-md tabular text-ink"

function StatsSection({
  stats,
  vault,
}: {
  stats: ReturnType<typeof deriveVaultStats>
  vault: Vault
}) {
  const items: Array<{ label: string; node: React.ReactNode }> = [
    {
      label: "TVL",
      node: (
        <MonoNumber value={stats.tvl} format="usd" compact size="md" />
      ),
    },
    {
      label: "24h Volume",
      node: (
        <MonoNumber value={stats.volume24h} format="usd" compact size="md" />
      ),
    },
    {
      label: "Holders",
      node: <MonoNumber value={stats.holders} format="count" size="md" />,
    },
    {
      label: "Performance Fee",
      node: (
        <MonoNumber
          value={stats.performanceFeeBps / 100}
          format="pct"
          precision={1}
          size="md"
        />
      ),
    },
    {
      label: "Mgmt + Deposit Fee",
      node: (
        <MonoNumber
          value={vault.depositFeeBps / 100}
          format="pct"
          precision={2}
          size="md"
        />
      ),
    },
    {
      label: "Inception",
      node: (
        <span className={STAT_VALUE_CLASS}>
          {new Date(stats.inception).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ]

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading text-ink">Stats</h2>
      <Stagger className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        {items.map((s) => (
          <Stagger.Item key={s.label}>
            <div className="flex flex-col gap-1.5">
              <span className={STAT_LABEL_CLASS}>{s.label}</span>
              <span className={STAT_VALUE_CLASS}>{s.node}</span>
            </div>
          </Stagger.Item>
        ))}
      </Stagger>
    </section>
  )
}

function CompositionSection({
  items,
}: {
  items: Array<{
    id: string
    ticker: string
    name: string
    logoUrl?: string | null
    weightBps: number
    delta24h?: number | null
  }>
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-heading text-ink">Composition</h2>
        <span className="font-mono text-mono-sm tabular text-ink-faint">
          {items.length} holdings
        </span>
      </div>
      <CompositionList items={items} />
    </section>
  )
}

function AboutCard({ description }: { description: string | null }) {
  const [expanded, setExpanded] = React.useState(false)
  const text =
    description ??
    "A curated basket of tokenized equities, weighted by conviction and rebalanced on a deterministic schedule."
  return (
    <Card>
      <h2 className="text-heading text-ink">About this vault</h2>
      <p
        className={cn(
          "text-body text-ink-muted",
          !expanded && "line-clamp-3",
        )}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex w-fit items-center gap-1 text-body-sm text-ink hover:text-accent"
      >
        {expanded ? "Show less" : "Read more"}
        <ChevronRight
          aria-hidden
          className={cn(
            "size-3.5 transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
      </button>
    </Card>
  )
}

function NewsList({ vault }: { vault: Vault }) {
  const items = React.useMemo(
    () => mockNewsFor(vault),
    [vault],
  )
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-heading text-ink">News</h2>
      <ul className="flex flex-col gap-3">
        {items.map((n) => (
          <li key={n.id}>
            <Card size="sm" interactive className="flex-row gap-4">
              <div
                aria-hidden
                className="size-14 shrink-0 rounded-tag bg-secondary"
                style={{
                  backgroundImage: `linear-gradient(135deg, oklch(0.45 0.205 263 / 0.18), oklch(0.92 0.003 80))`,
                }}
              />
              <div className="flex min-w-0 flex-col justify-center gap-1">
                <span className="text-body-sm uppercase tracking-[0.06em] text-ink-faint">
                  {n.source}
                </span>
                <span className="line-clamp-2 text-body font-medium text-ink">
                  {n.headline}
                </span>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}

function mockNewsFor(vault: Vault) {
  const seed = seedFromString(vault.id)
  const headlines = [
    `${vault.name} rebalance prints +${((seed % 50) / 10).toFixed(1)}% drift`,
    `Why investors are watching tokenized ${vault.name.toLowerCase()} baskets`,
    `Quarterly review: fees, flows, and the case for ${vault.name}`,
  ]
  const sources = ["The Block", "Solana Compass", "Coindesk"]
  return headlines.map((headline, i) => ({
    id: `${vault.id}-${i}`,
    headline,
    source: sources[i % sources.length],
  }))
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-[280px] w-full rounded-tag md:h-[360px]" />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="hidden h-[420px] w-full rounded-card lg:block" />
      </div>
    </div>
  )
}
