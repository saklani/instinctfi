import { Link } from "@tanstack/react-router"

import { cn } from "@/lib/utils"
import { Delta } from "@/components/ui/delta"
import { MonoNumber } from "@/components/ui/mono-number"
import { Row } from "@/components/ui/row"
import { toTitleCase } from "@/lib/format"
import type { Holding } from "../hooks/use-holdings"

const ROW_GRID_CLASS = cn(
  "grid items-center",
  "grid-cols-[minmax(0,1fr)_auto_auto]",
)

export function HoldingRow({ row }: { row: Holding }) {
  const { vault, vaultId, balanceUi, allTime } = row
  return (
    <Link
      to="/fund/$id"
      params={{ id: vaultId }}
      role="row"
      data-slot="holding-row"
      className={cn(
        ROW_GRID_CLASS,
        "rounded-sm text-sm",
        "transition-colors duration-150 outline-none",
        "hover:bg-secondary focus-visible:bg-secondary focus-visible:ring-[3px] focus-visible:ring-accent/30",
      )}
    >
      <Row className="min-w-0 items-center px-4 py-2">
        <HoldingLogo vault={vault} />
        <span className="truncate font-medium text-foreground">
          {toTitleCase(vault.name)}
        </span>
      </Row>

      <Row className="justify-end px-4">
        <MonoNumber value={balanceUi} format="raw" precision={4} size="md" />
      </Row>

      <Row className="justify-end px-4">
        <Delta value={allTime} hideArrow size="md" />
      </Row>
    </Link>
  )
}

export function HoldingTableHeader() {
  return (
    <div
      role="row"
      data-slot="holding-table-header"
      className={cn(
        ROW_GRID_CLASS,
        "text-xs uppercase tracking-wider text-muted-foreground/70 px-4",
      )}
    >
      <span role="columnheader">Vault</span>
      <span role="columnheader" className="text-right">
        Balance
      </span>
      <span role="columnheader" className="text-right">
        All-time
      </span>
    </div>
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
