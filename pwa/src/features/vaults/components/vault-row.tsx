import { Link } from "@tanstack/react-router"
import { ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
import type { Vault } from "../api"

export type VaultRowData = {
  vault: Vault
  ticker: string
  nav: number
  delta24h: number
  delta7d: number
  tvl: number
  holders: number
  inception: string
}

const ROW_GRID_CLASS = cn(
  "grid items-center gap-4",
  // Mobile: name | NAV | 24h
  "grid-cols-[minmax(0,1fr)_auto_auto]",
  // Tablet+: introduce TVL
  "md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(96px,1fr))]",
  // Desktop: full row — name | NAV | 24h | 7d | TVL | Holders | Inception
  "lg:grid-cols-[minmax(0,1.6fr)_repeat(6,minmax(96px,1fr))]",
)

export type VaultSortKey = "name" | "nav" | "delta24h" | "delta7d" | "tvl" | "holders" | "inception"

export type VaultSortState = {
  key: VaultSortKey
  dir: "asc" | "desc"
}

type VaultTableHeaderProps = {
  sort?: VaultSortState
  onSortChange?: (key: VaultSortKey) => void
}

const COLUMNS: Array<{
  key: VaultSortKey
  label: string
  align: "left" | "right"
  show: "always" | "md" | "lg"
}> = [
  { key: "name", label: "Vault", align: "left", show: "always" },
  { key: "nav", label: "NAV", align: "right", show: "always" },
  { key: "delta24h", label: "24h", align: "right", show: "always" },
  { key: "delta7d", label: "7d", align: "right", show: "lg" },
  { key: "tvl", label: "TVL", align: "right", show: "md" },
  { key: "holders", label: "Holders", align: "right", show: "lg" },
  { key: "inception", label: "Inception", align: "right", show: "lg" },
]

function showClass(show: "always" | "md" | "lg") {
  if (show === "always") return ""
  if (show === "md") return "hidden md:flex"
  return "hidden lg:flex"
}

export function VaultTableHeader({ sort, onSortChange }: VaultTableHeaderProps) {
  return (
    <div
      role="row"
      data-slot="vault-table-header"
      className={cn(
        ROW_GRID_CLASS,
        "px-4 pb-3 text-pill text-ink-faint",
      )}
    >
      {COLUMNS.map((col) => {
        const active = sort?.key === col.key
        const interactive = !!onSortChange
        return (
          <button
            key={col.key}
            type="button"
            role="columnheader"
            aria-sort={
              active ? (sort?.dir === "asc" ? "ascending" : "descending") : "none"
            }
            disabled={!interactive}
            onClick={() => onSortChange?.(col.key)}
            className={cn(
              "group/col flex items-center gap-1 outline-none",
              showClass(col.show),
              col.align === "right" && "justify-end",
              interactive
                ? "cursor-pointer hover:text-ink focus-visible:text-ink"
                : "cursor-default",
              active && "text-ink",
            )}
          >
            <span className={cn(interactive && "group-hover/col:underline underline-offset-4")}>
              {col.label}
            </span>
            {active && (
              <ChevronUp
                aria-hidden
                className={cn(
                  "size-3 transition-transform duration-150",
                  sort?.dir === "desc" && "rotate-180",
                )}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export function VaultRow({ row }: { row: VaultRowData }) {
  const { vault, ticker, nav, delta24h, delta7d, tvl, holders, inception } = row
  return (
    <Link
      to="/fund/$id"
      params={{ id: vault.id }}
      role="row"
      data-slot="vault-row"
      className={cn(
        ROW_GRID_CLASS,
        "rounded-tag px-4 py-4 text-body",
        "transition-colors duration-150 outline-none",
        "hover:bg-secondary focus-visible:bg-secondary",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <VaultRowLogo vault={vault} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-ink">{vault.name}</span>
          <span className="truncate font-mono text-mono-sm tabular text-ink-faint">
            ${ticker}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <MonoNumber
          value={nav}
          format="usd"
          precision={2}
          size="md"
          className="text-ink"
        />
      </div>

      <div className="flex justify-end">
        <Delta value={delta24h} hideArrow size="md" />
      </div>

      <div className={cn("hidden justify-end lg:flex")}>
        <Delta value={delta7d} hideArrow size="md" />
      </div>

      <div className={cn("hidden justify-end md:flex")}>
        <MonoNumber
          value={tvl}
          format="usd"
          compact
          precision={1}
          size="md"
          className="text-ink"
        />
      </div>

      <div className={cn("hidden justify-end lg:flex")}>
        <MonoNumber
          value={holders}
          format="count"
          size="md"
          className="text-ink"
        />
      </div>

      <div className={cn("hidden justify-end lg:flex")}>
        <span className="font-mono text-mono-sm tabular text-ink-muted">
          {formatInception(inception)}
        </span>
      </div>
    </Link>
  )
}

function VaultRowLogo({ vault }: { vault: Vault }) {
  if (vault.imageUrl) {
    return (
      <img
        src={vault.imageUrl}
        alt=""
        loading="lazy"
        className="size-7 shrink-0 rounded-full bg-secondary object-cover"
      />
    )
  }
  const stocks = vault.compositions?.slice(0, 3) ?? []
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
          {vault.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}

function formatInception(date: string) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}
