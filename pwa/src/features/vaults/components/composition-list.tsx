import { Link } from "@tanstack/react-router"

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

export type CompositionItem = {
  id: string
  ticker: string
  name: string
  logoUrl?: string | null
  /** Weight in basis points. */
  weight: number
}

export function CompositionList({ items }: { items: CompositionItem[] }) {
  if (!items.length) {
    return (
      <p className="text-center text-muted-foreground">
        Composition unavailable.
      </p>
    )
  }

  const sorted = [...items].sort((a, b) => b.weight - a.weight)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead className="text-right">Weight</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((item, index) => (
          <CompositionRow key={item.id} item={item} index={index} />
        ))}
      </TableBody>
    </Table>
  )
}

function CompositionRow({
  item,
  index,
}: {
  item: CompositionItem
  index: number
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-muted-foreground tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </TableCell>
      <TableCell>
        <Link
          to="/asset/$ticker"
          params={{ ticker: item.ticker }}
          className="outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 rounded-sm"
        >
          <Row className="min-w-0 items-center">
            <CompositionLogo item={item} />
            <span className="truncate font-medium text-foreground">
              {item.name}
            </span>
            <span className="hidden font-mono text-muted-foreground tabular-nums sm:inline">
              {item.ticker.toUpperCase()}
            </span>
          </Row>
        </Link>
      </TableCell>
      <TableCell className="text-right">
        <MonoNumber
          value={item.weight / 100}
          format="pct"
          precision={2}
          size="md"
        />
      </TableCell>
    </TableRow>
  )
}

function CompositionLogo({ item }: { item: CompositionItem }) {
  if (item.logoUrl) {
    return (
      <img
        src={item.logoUrl}
        alt=""
        loading="lazy"
        className="size-6 shrink-0 rounded-full bg-secondary object-cover"
      />
    )
  }
  return (
    <span
      aria-hidden
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs uppercase tracking-wider text-muted-foreground"
    >
      {item.ticker.slice(0, 2).toUpperCase()}
    </span>
  )
}

export function CompositionListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead className="text-right">Weight</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-3 w-5 rounded-sm" />
            </TableCell>
            <TableCell>
              <Row className="items-center">
                <Skeleton className="size-6 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-32 rounded-sm" />
              </Row>
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-12 rounded-sm" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
