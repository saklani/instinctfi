import { createFileRoute, Link } from "@tanstack/react-router"
import { usePrivy } from "@privy-io/react-auth"
import { useVault } from "@/hooks/use-vault"
import { useVaultBalance } from "@/hooks/use-vault-balance"
import { SolBalance } from "@/components/sol-balance"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
})

function PortfolioPage() {
  const { ready, authenticated, login } = usePrivy()
  const { vault } = useVault()
  const { balance: vaultTokens, loading: vaultLoading } = useVaultBalance()

  if (!ready) {
    return (
      <Column className="gap-6">
        <Column>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </Column>
      </Column>
    )
  }

  if (!authenticated) {
    return (
      <Column className="gap-6">
        <Column>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to view your holdings.
          </p>
          <Button className="mt-2" onClick={() => login()}>
            Sign In
          </Button>
        </Column>
      </Column>
    )
  }

  const vaultPrice = vault?.price ? parseFloat(vault.price) : 0
  const positionValue = vaultTokens && vaultPrice ? vaultTokens * vaultPrice : 0

  return (
    <Column className="gap-6">
      <Column>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground">
          Your holdings and balances.
        </p>
      </Column>

      {/* Wallet balance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wallet</CardTitle>
          <CardDescription>Available balances</CardDescription>
        </CardHeader>
        <CardContent>
          <Column className="gap-4">
            <Row className="items-center justify-between">
              <span className="text-sm text-muted-foreground">SOL</span>
              <SolBalance className="text-sm font-medium" />
            </Row>
          </Column>
        </CardContent>
      </Card>

      {/* Vault position */}
      {vaultTokens != null && vaultTokens > 0 && vault ? (
        <Link
          to="/fund/$id"
          params={{ id: import.meta.env.VITE_VAULT_ADDRESS }}
        >
          <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
            <CardHeader>
              <Row className="items-start justify-between">
                <Column>
                  <CardTitle className="text-base">{vault.name}</CardTitle>
                  <CardDescription>${vault.symbol}</CardDescription>
                </Column>
                <Column className="items-end">
                  <p className="text-lg font-semibold">
                    ${positionValue.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">value</p>
                </Column>
              </Row>
            </CardHeader>
            <CardContent>
              <Column className="gap-4">
                <Row className="items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Shares held
                  </span>
                  <span className="text-sm font-medium">
                    {vaultLoading
                      ? "..."
                      : vaultTokens.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                  </span>
                </Row>
                <Separator />
                <Row className="items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Share price
                  </span>
                  <span className="text-sm font-medium">
                    ${vaultPrice.toFixed(8)}
                  </span>
                </Row>
                <Separator />
                <Row className="items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Vault TVL
                  </span>
                  <span className="text-sm font-medium">
                    ${vault.tvl ? parseFloat(vault.tvl).toFixed(2) : "—"}
                  </span>
                </Row>
              </Column>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Card>
          <CardContent className="py-12">
            <Column className="items-center gap-4">
              <p className="text-sm text-muted-foreground text-center">
                No vault positions yet. Invest in an index fund to get started.
              </p>
              <Link to="/">
                <Button>Explore Funds</Button>
              </Link>
            </Column>
          </CardContent>
        </Card>
      )}
    </Column>
  )
}
