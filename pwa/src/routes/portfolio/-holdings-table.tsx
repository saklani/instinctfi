import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
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
import { useHoldings, type Holding } from "@/hooks/use-holdings"
import { WithdrawDialog } from "./-withdraw-dialog"

export function HoldingsTable() {
  const { holdings, loading } = useHoldings()
  return <HoldingsTableInner rows={holdings} loading={loading} />
}

export function HoldingsTableSkeleton() {
  return <HoldingsTableInner rows={[]} loading />
}

function HoldingsTableInner({ rows, loading }: { rows: Holding[]; loading: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vault</TableHead>
          <TableHead className="text-right">Invested</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">P&amp;L</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-sm text-muted-foreground py-8"
            >
              No positions yet.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => <HoldingBodyRow key={row.vault.id} row={row} />)
        )}
      </TableBody>
    </Table>
  )
}

function HoldingBodyRow({ row }: { row: Holding }) {
  return (
    <TableRow>
      <TableCell>
        <Link
          to="/fund/$id"
          params={{ id: row.vault.id }}
          className="outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 rounded-sm"
        >
          <Row className="min-w-0 items-center">
            <HoldingLogo vault={row.vault} />
            <span className="truncate font-medium text-foreground">
              {toTitleCase(row.vault.name)}
            </span>
          </Row>
        </Link>
      </TableCell>
      <TableCell className="text-right">
        <MonoNumber value={row.investedUsdc} format="usd" size="md" />
      </TableCell>
      <TableCell className="text-right">
        <MonoNumber value={row.currentValueUsdc} format="usd" size="md" />
      </TableCell>
      <TableCell className="text-right">
        <Delta value={row.pnlPct} hideArrow size="md" />
      </TableCell>
      <TableCell className="text-right">
        <WithdrawDialog holding={row}>
          <Button variant="outline" size="xs">
            Withdraw
          </Button>
        </WithdrawDialog>
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
  return (
    <div
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary"
    >
      <span className="font-mono text-[10px] tabular text-muted-foreground">
        {vault.name.slice(0, 2).toUpperCase()}
      </span>
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
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-16 rounded-sm" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-7 w-20 rounded-sm" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
