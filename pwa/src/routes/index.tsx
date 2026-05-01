import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card"
import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"
import { Skeleton } from "@/components/ui/skeleton"
import { useVaults, VaultCard } from "@/features/vaults"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: DiscoverPage,
})

function DiscoverPage() {
  const { vaults, loading, error } = useVaults()

  return (
    <Column className="gap-6">
      <Column>
        <h1>Discover</h1>
        <p>
          Your cheatcode to Internet Capital Markets.
        </p>
      </Column>

      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Column className="gap-4">
                <Skeleton className="h-3 w-20" />
                <Row className="flex-wrap">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-16" />
                  ))}
                </Row>
              </Column>
            </CardContent>
          </Card>
        ))}

      {error && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {vaults.map((vault) => (
        <VaultCard key={vault.id} vault={vault} />
      ))}
    </Column>
  )
}
