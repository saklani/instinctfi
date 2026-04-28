import { createFileRoute } from "@tanstack/react-router"
import { usePrivy } from "@privy-io/react-auth"
import { useWallet } from "@/hooks/use-wallet"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Row } from "@/components/ui/row"
import { Column } from "@/components/ui/column"
import { SolBalance } from "@/components/sol-balance"
import { UsdcBalance } from "@/components/usdc-balance"

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { ready, authenticated, login, logout, user } = usePrivy()
  const { address, truncatedAddress } = useWallet()

  if (!ready) {
    return (
      <Column>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </Column>
    )
  }

  if (!authenticated) {
    return (
      <Column>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue.
        </p>
        <Button className="mt-2" onClick={() => login()}>
          Sign In
        </Button>
      </Column>
    )
  }

  return (
    <Column className="gap-6">
      <Column>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your wallet and account.
        </p>
      </Column>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>
            Your authentication and wallet details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Column className="gap-4">
            <Row className="items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-medium text-emerald-500">Connected</span>
            </Row>

            <Separator />

            <Row className="items-center justify-between">
              <span className="text-sm text-muted-foreground">Wallet</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-1 py-0 font-mono text-sm"
                onClick={() =>
                  address && navigator.clipboard.writeText(address)
                }
                title="Click to copy full address"
              >
                {truncatedAddress}
              </Button>
            </Row>

            <Separator />

            <Row className="items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <span className="text-sm font-medium">Solana Devnet</span>
            </Row>

            {user?.email && (
              <>
                <Separator />
                <Row className="items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user.email.address}</span>
                </Row>
              </>
            )}
            <Separator />
            <Row className="items-center justify-between">
              <span className="text-sm text-muted-foreground">SOL</span>
              <SolBalance />
            </Row>
            <Separator />
            <Row className="items-center justify-between">
              <span className="text-sm text-muted-foreground">USDC</span>
              <UsdcBalance />
            </Row>
          </Column>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full"
        onClick={() => logout()}
      >
        Sign Out
      </Button>
    </Column>
  )
}
