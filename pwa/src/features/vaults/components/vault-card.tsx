import { Link } from "@tanstack/react-router"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Row } from "@/components/ui/row"
import { toTitleCase } from "@/lib/format"
import type { VaultResponse as Vault } from "../hooks/use-vaults"

export function VaultCard({ vault }: { vault: Vault }) {
  return (
    <Link to="/fund/$id" params={{ id: vault.id }}>
      <Card className="transition-all duration-150 hover:bg-accent/50 hover:shadow-md active:scale-[0.98] cursor-pointer">
        <VaultCover vault={vault} />

        <CardHeader>
          <CardTitle className="text-lg">{toTitleCase(vault.name)}</CardTitle>
          <CardDescription>{vault.description}</CardDescription>
        </CardHeader>

        <CardContent>
          <Row className="gap-0 -space-x-1.5">
            {vault.compositions?.map((c) => (
              <img
                key={c.stock.id}
                src={c.stock.imageUrl}
                alt={c.stock.ticker}
                title={c.stock.ticker}
                className="size-6 rounded-full ring-2 ring-background"
              />
            ))}
          </Row>
        </CardContent>
      </Card>
    </Link>
  )
}

function VaultCover({ vault }: { vault: Vault }) {
  if (vault.imageUrl) {
    return (
      <img
        src={vault.imageUrl}
        alt={`${vault.name} cover`}
        loading="lazy"
        className="aspect-[16/9] w-full object-cover"
      />
    )
  }

  const stocks = vault.compositions?.slice(0, 3) ?? []

  return (
    <div
      aria-hidden
      className="relative aspect-[16/9] w-full bg-secondary"
    >
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        {stocks.length > 0 ? (
          stocks.map((c) => (
            <img
              key={c.stock.id}
              src={c.stock.imageUrl}
              alt=""
              loading="lazy"
              className="size-12 rounded-full bg-background object-cover ring-2 ring-card"
            />
          ))
        ) : (
          <span className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            {vault.name.slice(0, 2)}
          </span>
        )}
      </div>
    </div>
  )
}
