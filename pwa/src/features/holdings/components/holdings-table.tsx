import { Link } from "@tanstack/react-router"

import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
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
import type { Holding } from "../hooks/use-holdings"

type HoldingsTableProps = {
  rows: Holding[]
  loading?: boolean
}

export function HoldingsTable({ rows, loading }: HoldingsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vault</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead className="text-right">All-time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <SkeletonRows />
        ) : (
          rows.map((row) => <HoldingBodyRow key={row.vaultId} row={row} />)
        )}
      </TableBody>
    </Table>
  )
}

function HoldingBodyRow({ row }: { row: Holding }) {
  const { vault, vaultId, balanceUi, allTime } = row
  return (
    <TableRow>
      <TableCell>
        <Link
          to="/fund/$id"
          params={{ id: vaultId }}
          className="outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 rounded-sm"
        >
          <Row className="min-w-0 items-center">
            <HoldingLogo vault={vault} />
            <span className="truncate font-medium text-foreground">
              {toTitleCase(vault.name)}
            </span>
          </Row>
        </Link>
      </TableCell>
      <TableCell className="text-right">
        <MonoNumber value={balanceUi} format="raw" precision={4} size="md" />
      </TableCell>
      <TableCell className="text-right">
        <Delta value={allTime} hideArrow size="md" />
      </TableCell>
    </TableRow>
  )
}

function HoldingLogo({ vault }: { vault: Holding["vault"] }) {
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

function SkeletonRows({ rows = 4 }: { rows?: number }) {
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
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-16 rounded-sm" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
