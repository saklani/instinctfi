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
import type { VaultResponse as Vault, VaultComposition } from "@/hooks/use-vaults"
import { useFeaturedVaults } from "./-use-enriched-vaults"


type FeaturedCardProps = {
  vault: Vault
}

export function FeaturedCard({ vault }: FeaturedCardProps) {
  return (
    <Card interactive className="relative shrink-0 w-[85%] snap-start lg:flex-1 lg:w-auto">
      <img
        src={vault.imageUrl}
        alt={`${vault.name} cover`}
        loading="lazy"
        className="aspect-square w-full object-cover"
      />

      {/* Stretched click overlay — sits below HoldingStack (z-20) so inner asset links keep working. */}
      <Link
        to="/fund/$id"
        params={{ id: vault.id }}
        aria-label={`View ${toTitleCase(vault.name)}`}
        className="absolute inset-0 z-10 rounded-xl outline-none focus-visible:ring-[4px] focus-visible:ring-accent/30"
      />

      <CardHeader>
        <CardTitle>{toTitleCase(vault.name)}</CardTitle>
        <CardDescription className="h-16">
          {vault.description}
        </CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter className="justify-between">
        <HoldingStack compositions={vault.compositions} />
        <Delta value={vault.allTime} size="lg" />
      </CardFooter>
    </Card>
  )
}

function HoldingStack({ compositions }: { compositions: VaultComposition[]; }) {
  const visible = compositions?.slice(0, 5) ?? []
  const overflow = Math.max(0, compositions.length - visible.length)
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
    <Card data-slot="featured-card-skeleton" className="shrink-0 w-[85%] snap-start lg:flex-1 lg:w-auto pt-0">
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

export function FeaturedCards() {
  const { rows, loading } = useFeaturedVaults()

  if (loading) {
    return (
      <Row className="overflow-x-auto gap-8 py-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible lg:mx-0 lg:px-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <FeaturedCardSkeleton key={i} />
        ))}
      </Row>
    )
  }

  return (
    <Row className="overflow-x-auto gap-8 py-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible lg:mx-0 lg:px-0">
      {rows.map((row) => (
        <FeaturedCard key={row.vault.id} vault={row.vault} />
      ))}
    </Row>
  )
}
