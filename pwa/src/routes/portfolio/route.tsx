import { createFileRoute } from "@tanstack/react-router"

import { useHoldings } from "@/hooks/use-holdings"
import { useWallet } from "@/hooks/use-wallet"

import { Button } from "@/components/ui/button"
import { Column } from "@/components/ui/column"
import { Skeleton } from "@/components/ui/skeleton"
import { HoldingsTable } from "./-holdings-table"

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
})

function PortfolioPage() {
  const { ready, authenticated, login } = useWallet()
  const { holdings, loading } = useHoldings()

  if (!ready) return <PortfolioSkeleton />
  if (!authenticated) return <PortfolioConnect onConnect={login} />

  return (
    <Column className="animate-in fade-in-0 duration-300 gap-12 py-12">
      <Column>
        <Column className="gap-2">
          <p className="text-sm text-muted-foreground font-heading">PORTFOLIO</p>
          <h1>Your Holdings</h1>
        </Column>
      </Column>
      <HoldingsTable rows={holdings} loading={loading} />
    </Column>
  )
}

function PortfolioConnect({ onConnect }: { onConnect: () => void }) {
  return (
    <Column className="animate-in fade-in-0 duration-300 py-12">
      <p className="text-sm">Portfolio</p>
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
    <Column className="gap-12 pt-12 pb-24">
      <Column>
        <Skeleton className="h-3 w-20 rounded-sm" />
        <Skeleton className="h-9 w-56 rounded-sm" />
      </Column>
      <HoldingsTable rows={[]} loading />
    </Column>
  )
}
