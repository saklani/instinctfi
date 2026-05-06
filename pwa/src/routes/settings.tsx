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
      <Column className="gap-6">
        <Header />
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
    <Column className="gap-6">
      <Header />

      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
          <CardDescription>Connected via Privy.</CardDescription>
        </CardHeader>
        <CardContent>
          <Column className="gap-4">
            <Row className="items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <span className="text-xs font-medium text-positive">
                Connected
              </span>
            </Row>
            <Separator />
            <Row className="items-center justify-between gap-3">
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

function Header() {
  return (
    <Column className="gap-1">
      <h1 className="text-2xl font-semibold tracking-tight font-semibold tracking-tight text-foreground">
        Settings
      </h1>
      <p className="text-sm text-muted-foreground">Manage your account.</p>
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
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-foreground transition-colors duration-150 hover:bg-secondary outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30"
    >
      <span className="font-mono tabular font-mono text-xs tabular-nums">
        {truncateAddress(address)}
      </span>
      <Copy
        className="size-3.5 text-muted-foreground/70 transition-colors group-hover:text-muted-foreground"
        aria-hidden
      />
      <span className="sr-only">Copy address</span>
    </button>
  )
}

function SettingsSkeleton() {
  return (
    <Column className="gap-6">
      <Column className="gap-1">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-44" />
      </Column>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Column className="gap-4">
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
