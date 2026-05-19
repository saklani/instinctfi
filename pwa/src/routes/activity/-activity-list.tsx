import { useState } from "react"
import { ChevronDown, ChevronUp, ExternalLinkIcon } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Column } from "@/components/ui/column"
import { LoadingButton } from "@/components/ui/loading-button"
import { MonoNumber } from "@/components/ui/mono-number"
import { Row } from "@/components/ui/row"
import { Skeleton } from "@/components/ui/skeleton"
import { toTitleCase, truncateAddress } from "@/lib/format"
import {
  cancelOrder,
  type Order,
  type OrderStatus,
  type SwapLegResult,
} from "@/lib/api"
import { useOrders } from "@/hooks/use-orders"
import { useVaults, type VaultResponse } from "@/hooks/use-vaults"

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Settling",
  completed: "Filled",
  partial: "Partial",
  failed: "Failed",
  cancelled: "Cancelled",
}

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline" | "ghost"
> = {
  pending: "outline",
  processing: "secondary",
  completed: "default",
  partial: "secondary",
  failed: "destructive",
  cancelled: "ghost",
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

function relativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(diffMs)
  if (abs < 60_000) return rtf.format(Math.round(diffMs / 1000), "second")
  if (abs < 3_600_000) return rtf.format(Math.round(diffMs / 60_000), "minute")
  if (abs < 86_400_000) return rtf.format(Math.round(diffMs / 3_600_000), "hour")
  return rtf.format(Math.round(diffMs / 86_400_000), "day")
}

function solscanTx(sig: string): string {
  return `https://solscan.io/tx/${sig}`
}

function vaultName(vault: VaultResponse | undefined): string {
  return vault ? toTitleCase(vault.name) : "Unknown vault"
}

export function ActivityList() {
  const { orders, loading: ordersLoading } = useOrders()
  const { vaults, loading: vaultsLoading } = useVaults()
  const loading = ordersLoading || vaultsLoading

  if (loading) return <ActivitySkeleton />
  if (orders.length === 0) {
    return <p className="text-center">No orders yet.</p>
  }

  const vaultsById = new Map(vaults.map((v) => [v.id, v]))

  return (
    <Column>
      {orders.map((order) => (
        <ActivityCard
          key={order.id}
          order={order}
          vault={vaultsById.get(order.vaultId)}
        />
      ))}
    </Column>
  )
}

function ActivityCard({
  order,
  vault,
}: {
  order: Order
  vault: VaultResponse | undefined
}) {
  switch (order.status) {
    case "pending":
    case "processing":
      return <InFlightCard order={order} vault={vault} />
    case "completed":
      return <FilledCard order={order} vault={vault} />
    case "partial":
      return <PartialCard order={order} vault={vault} />
    case "failed":
    case "cancelled":
      return <EndedCard order={order} vault={vault} />
  }
}

/* ------------------------------------------------------------------ */
/*  Shared header — name + stack + amount, then badge + time row      */
/* ------------------------------------------------------------------ */

function ActivityCardHeader({
  order,
  vault,
  timeIso,
  trailing,
}: {
  order: Order
  vault: VaultResponse | undefined
  timeIso: string
  trailing?: React.ReactNode
}) {
  const amountUsd = Number(order.amount) / 1e6
  return (
    <Column>
      <Row className="items-center justify-between">
        <Row className="min-w-0 items-center">
          {vault?.imageUrl && (
            <img
              src={vault.imageUrl}
              alt=""
              loading="lazy"
              className="size-10 shrink-0 rounded-full bg-secondary object-cover"
            />
          )}
          <h3 className="truncate">{vaultName(vault)}</h3>
        </Row>
        <MonoNumber value={amountUsd} format="usd" size="xl" />
      </Row>
      <Row className="items-center justify-between">
        <p>
          <Badge variant={STATUS_VARIANT[order.status]}>
            {STATUS_LABEL[order.status]}
          </Badge>{" "}
          <span className="text-xs text-muted-foreground">
            · {relativeTime(timeIso)}
          </span>
        </p>
        {trailing}
      </Row>
    </Column>
  )
}

/* ------------------------------------------------------------------ */
/*  State renderers                                                   */
/* ------------------------------------------------------------------ */

function InFlightCard({
  order,
  vault,
}: {
  order: Order
  vault: VaultResponse | undefined
}) {
  const isPending = order.status === "pending"

  const queryClient = useQueryClient()
  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: () => cancelOrder(order.id),
    onSuccess: () => {
      toast.success("Order cancelled", {
        description: "USDC refunded to your wallet.",
      })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["portfolio"] })
      queryClient.invalidateQueries({ queryKey: ["usdc-balance"] })
    },
    onError: (e: unknown) => {
      toast.error("Cancel failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    },
  })

  return (
    <Card size="sm">
      <CardContent>
        <ActivityCardHeader
          order={order}
          vault={vault}
          timeIso={order.createdAt}
          trailing={
            isPending ? (
              <LoadingButton
                variant="ghost"
                size="xs"
                isLoading={cancelling}
                onClick={() => cancel()}
              >
                Cancel &amp; refund
              </LoadingButton>
            ) : undefined
          }
        />
      </CardContent>
    </Card>
  )
}

function FilledCard({
  order,
  vault,
}: {
  order: Order
  vault: VaultResponse | undefined
}) {
  const [expanded, setExpanded] = useState(false)
  const decimalsByMint = new Map(
    vault?.compositions.map((c) => [c.stock.address, c.stock.decimals]) ?? [],
  )
  const tickerByMint = new Map(
    vault?.compositions.map((c) => [c.stock.address, c.stock.ticker]) ?? [],
  )

  return (
    <Card
      size="sm"
      interactive
      role="button"
      aria-expanded={expanded}
      onClick={() => setExpanded((v) => !v)}
    >
      <CardContent>
        <ActivityCardHeader
          order={order}
          vault={vault}
          timeIso={order.updatedAt}
          trailing={
            expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )
          }
        />

        {expanded && order.result.length > 0 && (
          <Column>
            {order.result.map((leg, i) => (
              <CompactLegRow
                key={`${leg.mint}-${i}`}
                leg={leg}
                ticker={tickerByMint.get(leg.mint)}
                decimals={decimalsByMint.get(leg.mint) ?? 8}
              />
            ))}
          </Column>
        )}
      </CardContent>
    </Card>
  )
}

function PartialCard({
  order,
  vault,
}: {
  order: Order
  vault: VaultResponse | undefined
}) {
  const filledCount = order.result.filter((r) => r.ok).length
  const tickerByMint = new Map(
    vault?.compositions.map((c) => [c.stock.address, c.stock.ticker]) ?? [],
  )
  const decimalsByMint = new Map(
    vault?.compositions.map((c) => [c.stock.address, c.stock.decimals]) ?? [],
  )

  return (
    <Card size="sm">
      <CardContent>
        <ActivityCardHeader order={order} vault={vault} timeIso={order.updatedAt} />
        <p className="text-sm text-muted-foreground">
          {filledCount} of {order.result.length} filled
        </p>

        <Column>
          {order.result.map((leg, i) => (
            <LegRow
              key={`${leg.mint}-${i}`}
              leg={leg}
              ticker={tickerByMint.get(leg.mint)}
              decimals={decimalsByMint.get(leg.mint) ?? 8}
            />
          ))}
        </Column>

        {order.refundSignature && (
          <p>
            <span className="eyebrow">Refund</span>{" "}
            <SignatureLink signature={order.refundSignature} />
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function EndedCard({
  order,
  vault,
}: {
  order: Order
  vault: VaultResponse | undefined
}) {
  return (
    <Card size="sm">
      <CardContent>
        <ActivityCardHeader order={order} vault={vault} timeIso={order.updatedAt} />

        {order.refundSignature && (
          <p>
            <span className="eyebrow">Refund</span>{" "}
            <SignatureLink signature={order.refundSignature} />
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function SignatureLink({ signature }: { signature: string }) {
  return (
    <a
      href={solscanTx(signature)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 font-mono text-sm text-foreground hover:underline"
    >
      {truncateAddress(signature, 8, 8)}
      <ExternalLinkIcon className="size-3" />
    </a>
  )
}

function CompactLegRow({
  leg,
  ticker,
  decimals,
}: {
  leg: SwapLegResult
  ticker: string | undefined
  decimals: number
}) {
  const label = ticker ?? truncateAddress(leg.mint, 4, 4)

  if (!leg.ok) {
    return (
      <Row className="items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{leg.reason}</span>
      </Row>
    )
  }

  const outUi = Number(leg.outAtomic) / 10 ** decimals
  return (
    <Row className="items-center justify-between">
      <span className="font-medium">{label}</span>
      <Row className="items-center">
        <span className="font-mono text-sm tabular-nums">
          {outUi.toFixed(6)}
        </span>
        <a
          href={solscanTx(leg.signature)}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground"
          aria-label="View on Solscan"
        >
          <ExternalLinkIcon className="size-3" />
        </a>
      </Row>
    </Row>
  )
}

function LegRow({
  leg,
  ticker,
  decimals,
}: {
  leg: SwapLegResult
  ticker: string | undefined
  decimals: number
}) {
  const label = ticker ?? truncateAddress(leg.mint, 4, 4)
  const weightPct = leg.weight / 100

  if (leg.ok) {
    const outUi = Number(leg.outAtomic) / 10 ** decimals
    return (
      <Row className="items-center justify-between rounded-sm border border-border px-3 py-2">
        <Column className="gap-0.5">
          <Row className="items-center gap-2">
            <span className="font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">{weightPct.toFixed(0)}%</span>
          </Row>
          <a
            href={solscanTx(leg.signature)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:underline"
          >
            {truncateAddress(leg.signature, 6, 6)}
            <ExternalLinkIcon className="size-3" />
          </a>
        </Column>
        <span className="font-mono text-sm tabular-nums">
          {outUi.toFixed(6)} {ticker ?? ""}
        </span>
      </Row>
    )
  }

  return (
    <Row className="items-center justify-between rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2">
      <Column className="gap-0.5">
        <Row className="items-center gap-2">
          <span className="font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">{weightPct.toFixed(0)}%</span>
        </Row>
        <span className="text-xs text-muted-foreground">
          {leg.reason}
          {leg.detail ? ` — ${leg.detail}` : ""}
        </span>
      </Column>
    </Row>
  )
}

function ActivitySkeleton({ count = 3 }: { count?: number }) {
  return (
    <Column>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} size="sm">
          <CardContent>
            <Row className="items-center justify-between">
              <Skeleton className="h-4 w-32 rounded-sm" />
              <Skeleton className="h-4 w-20 rounded-sm" />
            </Row>
            <Row className="items-center">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-sm" />
            </Row>
          </CardContent>
        </Card>
      ))}
    </Column>
  )
}
