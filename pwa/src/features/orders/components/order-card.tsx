import { ExternalLink } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Row } from "@/components/ui/row"
import { formatRaw } from "@/lib/format"
import { useVaultById } from "@/features/vaults"
import type { Order } from "../api"
import { Column } from "@/components/ui/column"

function statusBadge(status: Order["status"]) {
  switch (status) {
    case "pending":
    case "funded":
    case "processing":
      return <Badge variant="secondary">Processing</Badge>
    case "completed":
      return <Badge>Completed</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
    case "cancelled":
      return <Badge variant="outline">Cancelled</Badge>
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function OrderCard({ order }: { order: Order }) {
  const { vault } = useVaultById(order.vaultId)
  const vaultName = vault?.name

  return (
    <Card>
      <CardHeader>
        <Row className="items-start justify-between">
          <CardTitle className="capitalize">{order.type}</CardTitle>
          {statusBadge(order.status)}
        </Row>
      </CardHeader>
      <CardContent>
        <Row className="justify-between">
          <Column>
            {vaultName && (
              <span className="text-xs text-muted-foreground">{vaultName}</span>
            )}
            {vault?.compositions && (
              <Row className="gap-0 -space-x-1.5">
                {vault.compositions.map((c) => (
                  <img
                    key={c.stock.id}
                    src={c.stock.imageUrl}
                    alt={c.stock.ticker}
                    title={c.stock.ticker}
                    className="size-5 rounded-full ring-2 ring-background"
                  />
                ))}
              </Row>
            )}
          </Column>
          <span className="text-2xl font-semibold">{formatRaw(order.amount)}</span>
        </Row>

      </CardContent>
      <CardFooter className="justify-between items-center">
        <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
        {order.signature && (
          <a
            href={`https://solscan.io/tx/${order.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View on Solscan <ExternalLink className="size-3" />
          </a>
        )}
      </CardFooter>
    </Card>
  )
}
