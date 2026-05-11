import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Copy, LogOut } from "lucide-react"
import { toast } from "sonner"

import { useWallet } from "@/hooks/use-wallet"
import { truncateAddress } from "@/lib/format"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { ready, authenticated, walletAddress, login, logout } = useWallet()

  if (!ready) {
    return <SettingsSkeleton />
  }

  if (!authenticated) {
    return (

      <Column className="gap-12 pt-12 pb-24">
        <Card>
          <CardHeader>
            <CardTitle>Not connected</CardTitle>
            <CardDescription>
              Sign in to view your wallet and manage account settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => login()} className="w-full sm:w-auto">
              Sign in
            </Button>
          </CardContent>
        </Card>
      </Column>
    )
  }

  return (

    <Column className="gap-12 pt-12 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
          <CardDescription>Connected via Privy.</CardDescription>
        </CardHeader>
        <CardContent>
          <Column>
            <Row className="items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <span className="text-xs font-medium text-positive">
                Connected
              </span>
            </Row>
            <Separator />
            <Row className="items-center justify-between">
              <span className="text-xs text-muted-foreground">Address</span>
              {walletAddress ? (
                <CopyAddress address={walletAddress} />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </Row>
            <Separator />
            <Row className="items-center justify-between">
              <span className="text-xs text-muted-foreground">Network</span>
              <span className="text-xs font-medium text-foreground">
                Solana Mainnet
              </span>
            </Row>
          </Column>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => logout()}>
        <LogOut className="size-4" />
        Sign out
      </Button>
    </Column>
  )
}

function CopyAddress({ address }: { address: string }) {
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address)
      toast.success("Address copied")
    } catch {
      toast.error("Could not copy address")
    }
  }, [address])

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={handleCopy}
      className="rounded-full"
    >
      <span className="font-mono text-xs tabular-nums">
        {truncateAddress(address)}
      </span>
      <Copy
        className="size-3.5 text-muted-foreground/70"
        aria-hidden
      />
      <span className="sr-only">Copy address</span>
    </Button>
  )
}

function SettingsSkeleton() {
  return (
    <Column className="gap-12 pt-12 pb-24">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Column>
            <Row className="items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </Row>
            <Separator />
            <Row className="items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
            </Row>
            <Separator />
            <Row className="items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-28" />
            </Row>
          </Column>
        </CardContent>
      </Card>
      <Skeleton className="h-10 w-full rounded-full" />
    </Column>
  )
}
