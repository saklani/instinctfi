import { createFileRoute } from "@tanstack/react-router"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Row } from "@/components/ui/row"
import { Column } from "@/components/ui/column"

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { ready, authenticated, login, logout } = useWallet()

  if (!ready) {
    return (
      <Column className="gap-6">
        <Column>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <Skeleton className="h-4 w-40" />
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
                <Skeleton className="h-4 w-28" />
              </Row>
            </Column>
          </CardContent>
        </Card>
      </Column>
    )
  }

  if (!authenticated) {
    return (
      <Column>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue.</p>
        <Button className="mt-2" onClick={() => login()}>Sign In</Button>
      </Column>
    )
  }

  return (
    <Column className="gap-6">
      <Column>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account.</p>
      </Column>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your authentication details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Column className="gap-4">
            <Row className="items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-medium text-emerald-500">Connected</span>
            </Row>
            <Separator />
            <Row className="items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <span className="text-sm font-medium">Solana Mainnet</span>
            </Row>
          </Column>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full" onClick={() => logout()}>
        Sign Out
      </Button>
    </Column>
  )
}
