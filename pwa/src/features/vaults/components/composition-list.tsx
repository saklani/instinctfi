import * as React from "react"

import { cn } from "@/lib/utils"
import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
import { Skeleton } from "@/components/ui/skeleton"
import { Stagger } from "@/components/motion/stagger"

export type CompositionItem = {
  id: string
  ticker: string
  name: string
  logoUrl?: string | null
  /** Weight in basis points. */
  weightBps: number
  /** 24h delta as fraction (0.012 = 1.2%). */
  delta24h?: number | null
  /** Optional link target (e.g. /assets/$ticker). */
  href?: string
}

type CompositionListProps = React.ComponentProps<"ol"> & {
  items: CompositionItem[]
  /** When true, renders without entrance stagger (use inside already-animated containers). */
  staticMotion?: boolean
}

function rowClassName(href: string | undefined) {
  return cn(
    "group/row grid grid-cols-[28px_24px_1fr_auto] items-center gap-3 rounded-tag px-2 py-3",
    "transition-colors duration-150",
    href &&
      "cursor-pointer hover:bg-secondary outline-none focus-visible:bg-secondary focus-visible:ring-[3px] focus-visible:ring-accent/30",
  )
}

function CompositionRow({
  item,
  index,
}: {
  item: CompositionItem
  index: number
}) {
  const fallback = item.ticker.slice(0, 2).toUpperCase()
  const inner = (
    <>
      <span
        aria-hidden
        className="font-mono text-mono-sm tabular text-ink-faint"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="relative inline-flex size-6 items-center justify-center overflow-hidden rounded-full bg-secondary text-pill text-ink-muted">
        {item.logoUrl ? (
          <img
            src={item.logoUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <span aria-hidden>{fallback}</span>
        )}
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-body font-medium text-ink">
          {item.name}
        </span>
        <span className="hidden font-mono text-mono-sm tabular text-ink-muted sm:inline">
          {item.ticker.toUpperCase()}
        </span>
      </span>
      <span className="flex items-baseline gap-3">
        <MonoNumber
          value={item.weightBps / 100}
          format="pct"
          precision={2}
          size="md"
          className="text-ink"
        />
        <Delta value={item.delta24h ?? null} size="sm" suffix="24h" />
      </span>
    </>
  )

  if (item.href) {
    return (
      <a
        href={item.href}
        className={rowClassName(item.href)}
        data-slot="composition-row"
      >
        {inner}
      </a>
    )
  }

  return (
    <div className={rowClassName(undefined)} data-slot="composition-row">
      {inner}
    </div>
  )
}

export function CompositionList({
  items,
  className,
  staticMotion = false,
  ...props
}: CompositionListProps) {
  if (!items.length) {
    return (
      <div
        data-slot="composition-list-empty"
        className="rounded-tag border border-dashed border-hairline px-4 py-6 text-body-sm text-ink-muted"
      >
        Composition unavailable.
      </div>
    )
  }

  if (staticMotion) {
    return (
      <ol
        data-slot="composition-list"
        className={cn("flex flex-col divide-y divide-hairline", className)}
        {...props}
      >
        {items.map((item, index) => (
          <li key={item.id}>
            <CompositionRow item={item} index={index} />
          </li>
        ))}
      </ol>
    )
  }

  return (
    <Stagger
      gap={0.03}
      offset={6}
      data-slot="composition-list"
      className={cn("flex flex-col divide-y divide-hairline", className)}
      {...(props as React.ComponentProps<typeof Stagger>)}
    >
      {items.map((item, index) => (
        <Stagger.Item key={item.id} role="listitem">
          <CompositionRow item={item} index={index} />
        </Stagger.Item>
      ))}
    </Stagger>
  )
}

export function CompositionListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      data-slot="composition-list-skeleton"
      className="flex flex-col divide-y divide-hairline"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[28px_24px_1fr_auto] items-center gap-3 px-2 py-3"
        >
          <Skeleton className="h-3 w-5 rounded-tag" />
          <Skeleton className="size-6 rounded-full" />
          <div className="flex min-w-0 items-center gap-2">
            <Skeleton className="h-4 w-32 rounded-tag" />
            <Skeleton className="hidden h-3 w-12 rounded-tag sm:block" />
          </div>
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-4 w-12 rounded-tag" />
            <Skeleton className="h-3 w-10 rounded-tag" />
          </div>
        </div>
      ))}
    </div>
  )
}
