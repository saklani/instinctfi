import { Link } from "@tanstack/react-router"
import { ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
import { Skeleton } from "@/components/ui/skeleton"
import type { Vault } from "../api"

export type VaultRowData = {
  vault: Vault
  nav: number
  delta24h: number
}

const ROW_GRID_CLASS = cn(
  "grid items-center gap-4",
  "grid-cols-[minmax(0,1fr)_auto_auto]",
)

export type VaultSortKey = "name" | "nav" | "delta24h"

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
}> = [
  { key: "name", label: "Vault", align: "left" },
  { key: "nav", label: "NAV", align: "right" },
  { key: "delta24h", label: "24h", align: "right" },
]

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
              "group/col flex items-center gap-1 rounded-tag px-1.5 py-1 outline-none",
              col.align === "right" && "justify-end",
              interactive
                ? "cursor-pointer hover:text-ink focus-visible:text-ink focus-visible:ring-[3px] focus-visible:ring-accent/30"
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
  const { vault, nav, delta24h } = row
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
        "hover:bg-secondary focus-visible:bg-secondary focus-visible:ring-[3px] focus-visible:ring-accent/30",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <VaultRowLogo vault={vault} />
        <span className="truncate font-medium text-ink">{vault.name}</span>
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

export function VaultRowSkeleton() {
  return (
    <div
      data-slot="vault-row-skeleton"
      role="row"
      className={cn(ROW_GRID_CLASS, "px-4 py-4")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className="size-7 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-full max-w-[220px] rounded-tag" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-4 w-16 rounded-tag" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-4 w-12 rounded-tag" />
      </div>
    </div>
  )
}

export function VaultTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      data-slot="vault-table-skeleton"
      className="flex flex-col divide-y divide-hairline"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <VaultRowSkeleton key={i} />
      ))}
    </div>
  )
}
