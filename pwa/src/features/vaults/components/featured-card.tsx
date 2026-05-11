import { Link } from "@tanstack/react-router"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Delta } from "@/components/ui/delta"
import { Row } from "@/components/ui/row"
import { Skeleton } from "@/components/ui/skeleton"
import { toTitleCase } from "@/lib/format"
import type { VaultResponse as Vault } from "../hooks/use-vaults"
import { isLiveVault } from "../lib"
import { VaultStatusBadge } from "./vault-status-badge"

type FeaturedCardProps = {
  vault: Vault
  className?: string
}

export function FeaturedCard({ vault }: FeaturedCardProps) {
  const holdingCount = vault.compositions?.length ?? 0
  const live = isLiveVault(vault.id)
  return (
    <Card interactive={live} className="relative w-full">
      <img
        src={vault.imageUrl}
        alt={`${vault.name} cover`}
        loading="lazy"
        className="aspect-square w-full object-cover"
      />

      <div className="absolute right-3 top-3 z-30">
        <VaultStatusBadge live={live} />
      </div>

      {/* Stretched click overlay — sits below HoldingStack (z-20) so inner asset links keep working. */}
      {live && (
        <Link
          to="/fund/$id"
          params={{ id: vault.id }}
          aria-label={`View ${toTitleCase(vault.name)}`}
          className="absolute inset-0 z-10 rounded-xl outline-none focus-visible:ring-[4px] focus-visible:ring-accent/30"
        />
      )}

      <CardHeader>
        <CardTitle>{toTitleCase(vault.name)}</CardTitle>
        <CardDescription className="h-16">
          {vault.description}
        </CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter className="justify-between">
        <HoldingStack vault={vault} count={holdingCount} />
        <Delta value={vault.allTime} size="lg" />
      </CardFooter>
    </Card>
  )
}

function HoldingStack({ vault, count }: { vault: Vault; count: number }) {
  const visible = vault.compositions?.slice(0, 5) ?? []
  const overflow = Math.max(0, count - visible.length)
  return (
    <Row className="relative z-20 gap-0 -space-x-1.5 transition-all duration-200 has-[a:hover]:space-x-2">
      {visible.map((c) => (
        <Link
          key={c.stock.id}
          to="/asset/$ticker"
          params={{ ticker: c.stock.ticker }}
          aria-label={c.stock.ticker}
          title={c.stock.ticker}
          className="block rounded-full outline-none transition-all duration-200 hover:z-30 hover:scale-125 focus-visible:ring-[3px] focus-visible:ring-accent/30"
        >
          <img
            src={c.stock.imageUrl}
            alt=""
            loading="lazy"
            className="size-6 rounded-full bg-secondary object-cover ring-2 ring-card"
          />
        </Link>
      ))}
      {overflow > 0 && (
        <span className="z-10 inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium tabular text-muted-foreground ring-2 ring-card">
          +{overflow}
        </span>
      )}
    </Row>
  )
}

export function FeaturedCardSkeleton() {
  return (
    <Card data-slot="featured-card-skeleton" className="w-full">
      <Skeleton className="aspect-square w-full rounded-none" />
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-7 w-3/4 rounded-sm" />
        </CardTitle>
        <CardDescription>
          <Row className="gap-0 -space-x-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="size-6 rounded-full ring-2 ring-card"
              />
            ))}
          </Row>
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-between">
        <Skeleton className="h-5 w-16 rounded-sm" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </CardFooter>
    </Card>
  )
}
