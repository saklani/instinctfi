import { Link } from "@tanstack/react-router"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
import { Ticker as TickerPill } from "@/components/ui/pill"
import type { Vault } from "@/features/vaults/api"

export type HoldingRowData = {
  vaultId: string
  vault: Vault | null
  /** Symbol shown in the ticker pill (e.g. "MAG7"). */
  ticker?: string | null
  /** Share balance (UI units, not base units). */
  units: number
  /** Current value in USD. */
  value: number
  /** 24h delta as fraction (0.0124 = +1.24%). */
  delta24h: number | null
}

const ROW_GRID_CLASS = cn(
  "grid items-center gap-4",
  // Mobile: name | value | manage
  "grid-cols-[minmax(0,1fr)_auto_auto]",
  // Tablet+: name | units | value | 24h | manage
  "md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(96px,1fr))_auto]",
)

export function HoldingRow({ row }: { row: HoldingRowData }) {
  const { vault, vaultId, ticker, units, value, delta24h } = row
  const name = vault?.name ?? "Unknown vault"

  return (
    <div
      role="row"
      data-slot="holding-row"
      className={cn(
        ROW_GRID_CLASS,
        "rounded-tag px-4 py-4 text-body",
        "transition-colors duration-150",
        "hover:bg-secondary/60",
      )}
    >
      <Link
        to="/fund/$id"
        params={{ id: vaultId }}
        aria-label={`View ${name}`}
        className={cn(
          "flex min-w-0 items-center gap-3 outline-none",
          "focus-visible:ring-[3px] focus-visible:ring-accent/30 rounded-tag",
        )}
      >
        <HoldingLogo vault={vault} />
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-ink">{name}</span>
          {ticker && <TickerPill symbol={ticker} className="hidden sm:inline-flex" />}
        </span>
      </Link>

      <div className="hidden justify-end md:flex">
        <MonoNumber
          value={units}
          format="raw"
          precision={2}
          size="md"
          className="text-ink-muted"
        />
      </div>

      <div className="flex justify-end">
        <MonoNumber
          value={value}
          format="usd"
          precision={2}
          size="md"
          className="text-ink"
        />
      </div>

      <div className="hidden justify-end md:flex">
        <Delta value={delta24h} hideArrow size="md" />
      </div>

      <div className="flex justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link to="/fund/$id" params={{ id: vaultId }}>
            Manage
          </Link>
        </Button>
      </div>
    </div>
  )
}

type HoldingTableHeaderProps = {
  className?: string
}

export function HoldingTableHeader({ className }: HoldingTableHeaderProps) {
  return (
    <div
      role="row"
      data-slot="holding-table-header"
      className={cn(
        ROW_GRID_CLASS,
        "px-4 pb-3 text-pill text-ink-faint",
        className,
      )}
    >
      <span role="columnheader" className="flex">
        Vault
      </span>
      <span role="columnheader" className="hidden justify-end md:flex">
        Units
      </span>
      <span role="columnheader" className="flex justify-end">
        Value
      </span>
      <span role="columnheader" className="hidden justify-end md:flex">
        24h
      </span>
      <span role="columnheader" className="flex justify-end" aria-hidden>
        <span className="invisible">Manage</span>
      </span>
    </div>
  )
}

function HoldingLogo({ vault }: { vault: Vault | null }) {
  if (vault?.imageUrl) {
    return (
      <img
        src={vault.imageUrl}
        alt=""
        loading="lazy"
        className="size-7 shrink-0 rounded-full bg-secondary object-cover"
      />
    )
  }
  const stocks = vault?.compositions?.slice(0, 3) ?? []
  return (
    <div
      aria-hidden
      className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary"
    >
      {stocks.length > 0 ? (
        stocks.map((c, i) => (
          <img
            key={c.stock.id}
            src={c.stock.imageUrl}
            alt=""
            loading="lazy"
            className="absolute size-4 rounded-full ring-2 ring-canvas"
            style={{
              top: i === 0 ? 2 : i === 1 ? 11 : 7,
              left: i === 0 ? 2 : i === 1 ? 12 : 7,
              zIndex: 3 - i,
            }}
          />
        ))
      ) : (
        <span className="font-mono text-[10px] tabular text-ink-muted">
          {(vault?.name ?? "??").slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}
