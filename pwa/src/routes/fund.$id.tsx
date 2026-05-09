import * as React from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"

import { useVault } from "@/features/vaults"
import {
  CompositionList,
  CompositionListSkeleton,
} from "@/features/vaults/components/composition-list"
import {
  DepositPanel,
  DepositPanelSkeleton,
} from "@/features/vaults/components/deposit-panel"
import type { VaultResponse as Vault } from "@/features/vaults"
import { useWallet } from "@/hooks/use-wallet"
import { useJupiterPrices } from "@/hooks/use-jupiter-prices"
import { cn } from "@/lib/utils"
import { toTitleCase } from "@/lib/format"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import { Skeleton } from "@/components/ui/skeleton"
import { Ticker as TickerPill } from "@/components/ui/pill"
import { Delta } from "@/components/ui/delta"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  NavChart,
  NavChartSkeleton,
} from "@/components/chart/nav-chart"
import { StickyCta } from "@/components/sticky-cta"
import { useVaultNav } from "@/features/vaults/hooks/use-vault-nav"
import { Ticker } from "@/components/motion"

export const Route = createFileRoute("/fund/$id")({
  component: FundDetailPage,
})

const PERIODS = [
  { id: "1W", days: 7 },
  { id: "1M", days: 30 },
  { id: "3M", days: 90 },
  { id: "6M", days: 180 },
  { id: "1Y", days: 365 },
  { id: "5Y", days: 1825 },
] as const

type PeriodId = (typeof PERIODS)[number]["id"]

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function useCompositionPrices(vault: Vault | null) {
  const mints = React.useMemo(
    () => vault?.compositions.map((c) => c.stock.address) ?? [],
    [vault],
  )
  return useJupiterPrices(mints)
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

function FundDetailPage() {
  const { id } = Route.useParams()
  const { vault, loading, error } = useVault(id)
  const { authenticated, login, ready } = useWallet()
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [period, setPeriod] = React.useState<PeriodId>("1M")

  const { prices, loading: pricesLoading } = useCompositionPrices(vault)
  const navValue = vault?.nav ?? null
  const navDelta = vault?.delta24h ?? null

  // Fetch the full 1y series once; slice locally per period.
  const { series: fullSeries } = useVaultNav(vault?.id, 1825)

  // Periods only render if the underlying series spans enough days.
  const availableSpanDays = React.useMemo(() => {
    if (fullSeries.length < 2) return 0
    const first = new Date(fullSeries[0].date).getTime()
    const last = new Date(fullSeries[fullSeries.length - 1].date).getTime()
    return Math.floor((last - first) / 86_400_000)
  }, [fullSeries])

  const availablePeriods = React.useMemo(
    () => PERIODS.filter((p) => p.days <= availableSpanDays || p.id === "1W"),
    [availableSpanDays],
  )

  // Auto-clamp the selected period if it became unavailable.
  React.useEffect(() => {
    if (!availablePeriods.some((p) => p.id === period) && availablePeriods.length > 0) {
      setPeriod(availablePeriods[availablePeriods.length - 1].id)
    }
  }, [availablePeriods, period])

  const chartData = React.useMemo(() => {
    if (!fullSeries.length) return fullSeries
    const days = PERIODS.find((p) => p.id === period)?.days ?? 30
    const cutoffMs = Date.now() - days * 86_400_000
    return fullSeries.filter((p) => new Date(p.date).getTime() >= cutoffMs)
  }, [fullSeries, period])

  const compositionItems = React.useMemo(() => {
    if (!vault) return []
    return vault.compositions.map((c) => ({
      id: c.stock.id,
      ticker: c.stock.ticker,
      name: c.stock.name,
      logoUrl: c.stock.imageUrl,
      weight: c.weight,
      delta24h: prices[c.stock.address]?.priceChange24h ?? null,
    }))
  }, [vault, prices])

  if (loading) return <DetailSkeleton />

  if (error || !vault) {
    return (
      <Column className="items-center text-center">
        <p>{error ?? "Vault not found"}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back to Discover</Link>
        </Button>
      </Column>
    )
  }

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
      <Column className="animate-in fade-in-0 duration-300 gap-12 pt-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
          {/* LEFT */}
          <Column className="min-w-0">
            <AssetHeader vault={vault} />
            <hr className="border-border" />

            {chartData.length > 0 && (
              <NavChart
                data={chartData}
                periodKey={period}
                periodSelector={
                  <Tabs
                    value={period}
                    onValueChange={(v) => setPeriod(v as PeriodId)}
                  >
                    <TabsList variant="line">
                      {availablePeriods.map((p) => (
                        <TabsTrigger key={p.id} value={p.id}>
                          {p.id}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                }
              />
            )}

            <CompositionSection items={compositionItems} />

            {/* Mobile-only About */}
            <Column className="lg:hidden">
              <AboutCard description={vault.description} />
            </Column>
          </Column>

          {/* RIGHT */}
          <Column className="hidden lg:flex">
            <div className="lg:sticky lg:top-24">
              <Card>
                <CardContent>
                  <DepositPanel vault={vault} />
                </CardContent>
              </Card>
            </div>
            <AboutCard description={vault.description} />
          </Column>
        </div>
      </Column>

      {/* MOBILE sticky CTA + Sheet */}
      <StickyCta onClick={handleStickyCta} expandable>
        {!ready ? "Loading…" : !authenticated ? "Connect wallet" : "Deposit USDC"}
      </StickyCta>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-xl border-t border-border bg-background"
        >
          <SheetHeader>
            <SheetTitle>{toTitleCase(vault.name)}</SheetTitle>
            <SheetDescription>
              Deposit USDC, queue at next NAV print.
            </SheetDescription>
          </SheetHeader>
          <DepositPanel vault={vault} onDone={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function AssetHeader({ vault }: { vault: Vault }) {
  const ticker = tickerSymbolFor(vault)
  return (
    <Row className="items-center">
      <VaultLogo vault={vault} />
      <Column className="min-w-0">
        <h1>{toTitleCase(vault.name)}</h1>
        {ticker && (
          <Row className="flex-wrap items-center">
            <TickerPill symbol={ticker} />
          </Row>
        )}
      </Column>
    </Row>
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
          className="absolute size-10 rounded-full ring-2 ring-background"
          style={{
            top: i === 0 ? 4 : i === 1 ? 32 : 18,
            left: i === 0 ? 4 : i === 1 ? 38 : 22,
            zIndex: 3 - i,
          }}
        />
      ))}
      {stocks.length === 0 && (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm tabular-nums text-muted-foreground">
          {vault.name.slice(0, 2).toUpperCase()}
        </span>
      )}
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
  loading,
}: {
  value: number | null
  delta: number | null
  loading: boolean
}) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return (
    <Column>
      <p>NAV per share</p>
      <Row className="flex-wrap items-baseline">
        {loading || value == null ? (
          <Skeleton className="h-10 w-32 rounded-sm" />
        ) : (
          <h2>
            <Ticker value={value} decimals={2} prefix="$" />
          </h2>
        )}
        <Delta value={delta} size="lg" suffix="24h" />
      </Row>
      <p>{today}</p>
    </Column>
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
    weight: number
    delta24h?: number | null
  }>
}) {
  return (
    <Column className="mt-6">
      <Row className="items-baseline justify-between">
        <h2>Composition</h2>
        <p>{items.length} holdings</p>
      </Row>
      <CompositionList items={items} />
    </Column>
  )
}

function AboutCard({ description }: { description: string | null }) {
  const text =
    description ??
    "A curated basket of tokenized equities, weighted by conviction and rebalanced on a deterministic schedule."
  return (
    <Card>
      <CardHeader>
        <CardTitle>About this vault</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{text}</p>
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
          <CompositionListSkeleton rows={5} />
        </Column>
        <Card className="hidden lg:block">
          <DepositPanelSkeleton />
        </Card>
      </div>
    </Column>
  )
}
