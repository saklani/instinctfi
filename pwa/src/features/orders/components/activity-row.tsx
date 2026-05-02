import { ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MonoNumber } from "@/components/ui/mono-number"
import type { Order } from "../api"

export type ActivityRowData = {
  order: Order
  /** Vault display name; "Unknown vault" if not yet resolved. */
  vaultName: string | null
}

const ROW_GRID_CLASS = cn(
  "grid items-center gap-4",
  // Mobile: action + vault stacked w/ amount
  "grid-cols-[minmax(0,1fr)_auto_auto]",
  // Tablet+: date | action | vault | amount | tx
  "md:grid-cols-[minmax(120px,auto)_minmax(120px,auto)_minmax(0,1fr)_auto_auto]",
)

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function ActivityRow({ row }: { row: ActivityRowData }) {
  const { order, vaultName } = row
  const date = formatDate(order.createdAt)
  const amountUsd = Number(order.amount) / 1e6

  return (
    <div
      role="row"
      data-slot="activity-row"
      className={cn(
        ROW_GRID_CLASS,
        "rounded-tag px-4 py-4 text-body",
        "transition-colors duration-150",
        "hover:bg-secondary/60",
      )}
    >
      {/* Mobile: vault + date stacked. Desktop: separate columns. */}
      <div className="flex min-w-0 flex-col gap-1 md:hidden">
        <span className="truncate font-medium text-ink">
          {vaultName ?? "Unknown vault"}
        </span>
        <span className="font-mono text-mono-sm tabular text-ink-faint">
          {date}
        </span>
      </div>

      <span className="hidden font-mono text-mono-sm tabular text-ink-muted md:inline">
        {date}
      </span>

      <div className="hidden md:flex">
        <ActionChip type={order.type} status={order.status} />
      </div>

      <span className="hidden truncate font-medium text-ink md:inline">
        {vaultName ?? "Unknown vault"}
      </span>

      <div className="flex flex-col items-end gap-1 md:flex-row md:items-center md:gap-3">
        <ActionChip
          type={order.type}
          status={order.status}
          className="md:hidden"
        />
        <MonoNumber
          value={amountUsd}
          format="usd"
          precision={2}
          size="md"
          className="text-ink"
        />
      </div>

      <div className="flex justify-end">
        {order.signature ? (
          <a
            href={`https://solscan.io/tx/${order.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View transaction on Solscan"
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full",
              "text-ink-muted transition-colors duration-150",
              "hover:bg-secondary hover:text-ink",
              "outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30",
            )}
          >
            <ExternalLink className="size-4" />
          </a>
        ) : (
          <span aria-hidden className="inline-flex size-8" />
        )}
      </div>
    </div>
  )
}

type ActionChipProps = {
  type: Order["type"]
  status: Order["status"]
  className?: string
}

function ActionChip({ type, status, className }: ActionChipProps) {
  const isPending =
    status === "pending" || status === "funded" || status === "processing"
  const isFailed = status === "failed" || status === "cancelled"
  const variant = isFailed
    ? "destructive"
    : isPending
      ? "secondary"
      : "outline"

  const label = isPending
    ? `${capitalize(type)} · processing`
    : isFailed
      ? `${capitalize(type)} · ${capitalize(status)}`
      : capitalize(type)

  return (
    <Badge variant={variant} className={cn("font-mono", className)}>
      {label}
    </Badge>
  )
}

export function ActivityTableHeader({ className }: { className?: string }) {
  return (
    <div
      role="row"
      data-slot="activity-table-header"
      className={cn(
        ROW_GRID_CLASS,
        "px-4 pb-3 text-pill text-ink-faint",
        className,
      )}
    >
      <span role="columnheader" className="hidden md:flex">
        Date
      </span>
      <span role="columnheader" className="hidden md:flex">
        Action
      </span>
      <span role="columnheader" className="flex">
        Vault
      </span>
      <span role="columnheader" className="flex justify-end">
        Amount
      </span>
      <span role="columnheader" className="flex justify-end" aria-hidden>
        <span className="invisible">Tx</span>
      </span>
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : dateFormatter.format(d)
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
