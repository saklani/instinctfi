import { createFileRoute } from "@tanstack/react-router"

import { useWallet } from "@/hooks/use-wallet"

import { Button } from "@/components/ui/button"
import { Column } from "@/components/ui/column"
import { ActivityList } from "./-activity-list"

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
})

function ActivityPage() {
  const { ready, authenticated, login } = useWallet()

  if (!ready || !authenticated) {
    return <ActivityConnect onConnect={login} disabled={!ready} />
  }

  return (
    <Column className="animate-in fade-in-0 duration-300 gap-12 py-12">
      <Column className="gap-2">
        <p className="eyebrow">ACTIVITY</p>
        <h1>Recent Orders</h1>
      </Column>
      <ActivityList />
    </Column>
  )
}

function ActivityConnect({
  onConnect,
  disabled,
}: {
  onConnect: () => void
  disabled: boolean
}) {
  return (
    <Column className="animate-in fade-in-0 duration-300 py-12">
      <p className="eyebrow">ACTIVITY</p>
      <h1 className="max-w-2xl">Connect a wallet to see your activity.</h1>
      <p className="max-w-md">
        Sign in with Privy to view your deposits and their settlement status.
      </p>
      <Button
        onClick={onConnect}
        disabled={disabled}
        variant="default"
        size="lg"
        className="self-start"
      >
        Connect wallet
      </Button>
    </Column>
  )
}
