import * as React from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import {
  Bookmark,
  ChevronRight,
  MessageCircle,
  MoreHorizontal,
  Search,
  Share2,
} from "lucide-react"

import { useVault } from "@/features/vaults"
import {
  CompositionList,
  CompositionListSkeleton,
} from "@/features/vaults/components/composition-list"
import {
  DepositPanel,
  DepositPanelSkeleton,
} from "@/features/vaults/components/deposit-panel"
import type { Vault } from "@/features/vaults/api"
import { usePendingOrders, OrderCard } from "@/features/orders"
import { useWallet } from "@/hooks/use-wallet"
import { useJupiterPrices } from "@/hooks/use-jupiter-prices"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Ticker as TickerPill, Count, Verified } from "@/components/ui/pill"
import { Delta } from "@/components/ui/delta"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Reveal } from "@/components/motion/reveal"
import { Ticker } from "@/components/motion/ticker"
import { StickyCta } from "@/components/sticky-cta"

export const Route = createFileRoute("/fund/$id")({
  component: FundDetailPage,
})

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function useVaultPrices(vault: Vault | null) {
  const mints = React.useMemo(
    () => vault?.compositions.map((c) => c.stock.address) ?? [],
    [vault],
  )
  const { prices, loading, error } = useJupiterPrices(mints)

  return React.useMemo(() => {
    if (!vault || !Object.keys(prices).length) {
      return { navValue: null, navDelta: null, prices, loading, error }
    }

    let nav = 0
    let weightedDelta = 0
    let totalWeight = 0

    for (const c of vault.compositions) {
      const p = prices[c.stock.address]
      if (!p) continue
      const w = c.weightBps / 10_000
      nav += w * p.usdPrice
      weightedDelta += w * p.priceChange24h
      totalWeight += w
    }

    // Re-normalise when some mints are missing from Jupiter
    if (totalWeight > 0 && totalWeight < 0.99) {
      nav /= totalWeight
      weightedDelta /= totalWeight
    }

    return {
      navValue: totalWeight > 0 ? nav : null,
      navDelta: totalWeight > 0 ? weightedDelta : null,
      prices,
      loading,
      error,
    }
  }, [vault, prices, loading, error])
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

function FundDetailPage() {
  const { id } = Route.useParams()
  const { vault, loading, error } = useVault(id)
  const { authenticated, login, ready } = useWallet()
  const { orders: pendingOrders } = usePendingOrders()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const { navValue, navDelta, prices, loading: pricesLoading } = useVaultPrices(vault)

  const myPendingOrders = pendingOrders.filter((o) => o.vaultId === id)

  const compositionItems = React.useMemo(() => {
    if (!vault) return []
    return vault.compositions.map((c) => ({
      id: c.stock.id,
      ticker: c.stock.ticker,
      name: c.stock.name,
      logoUrl: c.stock.imageUrl,
      weightBps: c.weightBps,
      delta24h: prices[c.stock.address]?.priceChange24h ?? null,
    }))
  }, [vault, prices])

  if (loading) return <DetailSkeleton />

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

            <NavPriceBlock
              value={navValue}
              delta={navDelta}
              loading={pricesLoading}
            />

            <CompositionSection items={compositionItems} />

            {authenticated && myPendingOrders.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-heading text-ink">Open orders</h2>
                {myPendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </section>
            )}

            {/* Mobile-only About */}
            <div className="flex flex-col gap-6 lg:hidden">
              <AboutCard description={vault.description} />
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

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-body-sm text-ink-muted"
    >
      <Link
        to="/"
        className="rounded-tag px-1 hover:text-ink outline-none focus-visible:text-ink focus-visible:ring-[3px] focus-visible:ring-accent/30"
      >
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
    <div className="flex flex-col gap-2">
      <span className="text-body-sm text-ink-muted">NAV per share</span>
      <div className="flex flex-wrap items-baseline gap-3">
        {loading || value == null ? (
          <Skeleton className="h-10 w-32 rounded-tag" />
        ) : (
          <Ticker
            value={value}
            decimals={2}
            prefix="$"
            className="text-mono-xl font-medium text-ink"
          />
        )}
        <Delta value={delta} size="lg" suffix="24h" />
      </div>
      <span className="font-mono text-mono-sm tabular text-ink-faint">
        {today}
      </span>
    </div>
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
        className="inline-flex w-fit items-center gap-1 rounded-tag px-1.5 py-0.5 text-body-sm text-ink hover:text-accent outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30"
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

/* ------------------------------------------------------------------ */
/*  Skeleton                                                          */
/* ------------------------------------------------------------------ */

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-4 w-40 rounded-tag" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-9 w-2/3 rounded-tag" />
              <Skeleton className="h-6 w-1/3 rounded-tag" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24 rounded-tag" />
            <Skeleton className="h-10 w-40 rounded-tag" />
          </div>
          <CompositionListSkeleton rows={5} />
        </div>
        <Card className="hidden lg:block">
          <DepositPanelSkeleton />
        </Card>
      </div>
    </div>
  )
}
