import { Link } from "@tanstack/react-router"
import { ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Delta } from "@/components/ui/delta"
import { Row } from "@/components/ui/row"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toTitleCase } from "@/lib/format"
import type { VaultResponse as Vault } from "../hooks/use-vaults"

export type VaultRowData = {
  vault: Vault
  allTime: number | null
}

export type VaultSortKey = "name" | "allTime"

export type VaultSortState = {
  key: VaultSortKey
  dir: "asc" | "desc"
}

type VaultTableProps = {
  rows: VaultRowData[]
  sort: VaultSortState
  onSort: (key: VaultSortKey) => void
  loading: boolean
  error: string | null
}

export function VaultTable({ rows, sort, onSort, loading, error }: VaultTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHead sortKey="name" label="Vault" sort={sort} onSort={onSort} />
          <SortHead
            sortKey="allTime"
            label="All-time"
            align="right"
            sort={sort}
            onSort={onSort}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && <SkeletonRows />}
        {error && (
          <TableRow>
            <TableCell colSpan={2} className="text-center text-destructive">
              {error}
            </TableCell>
          </TableRow>
        )}
        {!loading && !error && rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={2} className="text-center text-muted-foreground">
              No vaults yet. Check back soon.
            </TableCell>
          </TableRow>
        )}
        {!loading && !error &&
          rows.map((row) => <VaultBodyRow key={row.vault.id} row={row} />)}
      </TableBody>
    </Table>
  )
}

function SortHead({
  sortKey,
  label,
  align = "left",
  sort,
  onSort,
}: {
  sortKey: VaultSortKey
  label: string
  align?: "left" | "right"
  sort: VaultSortState
  onSort: (key: VaultSortKey) => void
}) {
  const active = sort.key === sortKey
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "group/col inline-flex items-center rounded-sm outline-none",
          align === "right" && "ml-auto",
          "cursor-pointer hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-accent/30",
          active && "text-foreground",
        )}
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <span className="group-hover/col:underline underline-offset-4">
          {label}
        </span>
        {active && (
          <ChevronUp
            aria-hidden
            className={cn(
              "size-3 transition-transform duration-150",
              sort.dir === "desc" && "rotate-180",
            )}
          />
        )}
      </button>
    </TableHead>
  )
}

function VaultBodyRow({ row }: { row: VaultRowData }) {
  const { vault, allTime } = row
  return (
    <TableRow>
      <TableCell>
        <Link
          to="/fund/$id"
          params={{ id: vault.id }}
          className="outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 rounded-sm"
        >
          <Row className="min-w-0 items-center">
            <VaultRowLogo vault={vault} />
            <span className="truncate font-medium text-foreground">
              {toTitleCase(vault.name)}
            </span>
          </Row>
        </Link>
      </TableCell>
      <TableCell className="text-right">
        <Delta value={allTime} hideArrow size="md" />
      </TableCell>
    </TableRow>
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
            className="absolute size-4 rounded-full ring-2 ring-background"
            style={{
              top: i === 0 ? 2 : i === 1 ? 11 : 7,
              left: i === 0 ? 2 : i === 1 ? 12 : 7,
              zIndex: 3 - i,
            }}
          />
        ))
      ) : (
        <span className="font-mono text-[10px] tabular text-muted-foreground">
          {vault.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}

function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Row className="items-center">
              <Skeleton className="size-7 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-full max-w-[220px] rounded-sm" />
            </Row>
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-16 rounded-sm" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
