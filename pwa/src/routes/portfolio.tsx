import { Link, createFileRoute } from "@tanstack/react-router"

import { useHoldings, HoldingRow, HoldingTableHeader } from "@/features/holdings"
import { useWallet } from "@/hooks/use-wallet"

import { Button } from "@/components/ui/button"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import { Skeleton } from "@/components/ui/skeleton"
import { PortfolioEmpty } from "@/components/portfolio-empty"

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
})

function PortfolioPage() {
  const { ready, authenticated, login } = useWallet()
  const { holdings, loading } = useHoldings()

  if (!ready) return <PortfolioSkeleton />
  if (!authenticated) return <PortfolioConnect onConnect={login} />
  if (!loading && holdings.length === 0) {
    return (
      <Column className="animate-in fade-in-0 duration-300 py-12">
        <PortfolioEmpty />
      </Column>
    )
  }

  return (
    <Column className="animate-in fade-in-0 duration-300 gap-12 py-12">
      <Column>
        <p className="text-xs uppercase tracking-wider text-muted-foreground/70">
          Portfolio
        </p>
        <h1>Your holdings</h1>
      </Column>

      <Column>
        <HoldingTableHeader />
        {loading ? (
          <RowsSkeleton />
        ) : (
          holdings.map((row) => <HoldingRow key={row.vaultId} row={row} />)
        )}
      </Column>
    </Column>
  )
}

function PortfolioConnect({ onConnect }: { onConnect: () => void }) {
  return (
    <Column className="animate-in fade-in-0 duration-300 py-12">
      <p className="text-xs uppercase tracking-wider text-muted-foreground/70">
        Portfolio
      </p>
      <h1 className="max-w-2xl">Connect a wallet to see your holdings.</h1>
      <p className="max-w-md">
        Sign in with Privy to view the vault tokens held by your wallet.
      </p>
      <Button onClick={onConnect} variant="default" size="lg" className="self-start">
        Connect wallet
      </Button>
    </Column>
  )
}

function PortfolioSkeleton() {
  return (
    <Column className="gap-12 py-12">
      <Column>
        <Skeleton className="h-3 w-20 rounded-sm" />
        <Skeleton className="h-9 w-56 rounded-sm" />
      </Column>
      <RowsSkeleton />
    </Column>
  )
}

function RowsSkeleton() {
  return (
    <Column className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <Row key={i} className="items-center px-4 py-2">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-4 flex-1 max-w-[280px] rounded-sm" />
          <Skeleton className="h-4 w-16 rounded-sm" />
          <Skeleton className="h-4 w-16 rounded-sm" />
        </Row>
      ))}
    </Column>
  )
}
