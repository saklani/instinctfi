import { createFileRoute } from "@tanstack/react-router"
import { Column } from "@/components/ui/column"

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
})

function PortfolioPage() {
  return (
    <Column>
      <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
      <p className="text-sm text-muted-foreground">
        Your holdings and performance.
      </p>
    </Column>
  )
}
