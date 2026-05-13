import { ArrowUpRight } from "lucide-react"

import { MonoNumber } from "@/components/ui/mono-number"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useLeaderboard, type LeaderboardEntry } from "./-use-leaderboard"

export function LeaderboardTable() {
  const { wallets, loading } = useLeaderboard()
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Wallet</TableHead>
          <TableHead className="text-right">Holdings</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <SkeletonRows />
        ) : wallets.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground">
              No on-chain holdings yet.
            </TableCell>
          </TableRow>
        ) : (
          wallets.map((row, i) => (
            <LeaderboardBodyRow key={row.address} row={row} index={i} />
          ))
        )}
      </TableBody>
    </Table>
  )
}

function LeaderboardBodyRow({
  row,
  index,
}: {
  row: LeaderboardEntry
  index: number
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-muted-foreground tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </TableCell>
      <TableCell>
        <a
          href={`https://solscan.io/account/${row.address}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center font-mono text-foreground tabular-nums hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 rounded-sm"
        >
          {shortAddr(row.address)}
          <ArrowUpRight aria-hidden className="size-3.5 text-muted-foreground" />
        </a>
      </TableCell>
      <TableCell className="text-right">
        <MonoNumber value={row.valueUsd} format="usd" precision={2} size="md" />
      </TableCell>
    </TableRow>
  )
}

function SkeletonRows({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-3 w-5 rounded-sm" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-44 rounded-sm" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-16 rounded-sm" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function shortAddr(a: string) {
  return `${a.slice(0, 8)}…${a.slice(-8)}`
}
