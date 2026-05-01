import { Link } from "@tanstack/react-router"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Row } from "@/components/ui/row"
import type { Vault } from "../api"

export function VaultCard({ vault }: { vault: Vault }) {
  return (
    <Link to="/fund/$id" params={{ id: vault.id }}>
      <Card className="transition-all duration-150 hover:bg-accent/50 hover:shadow-md active:scale-[0.98] cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{vault.name}</CardTitle>
          <CardDescription>{vault.description}</CardDescription>
        </CardHeader>

        <CardContent>
          <Row className="gap-0 -space-x-1.5">
            {vault.compositions?.map((c) => (
              <img
                key={c.stock.id}
                src={c.stock.imageUrl}
                alt={c.stock.ticker}
                title={c.stock.ticker}
                className="size-6 rounded-full ring-2 ring-background"
              />
            ))}
          </Row>
        </CardContent>
      </Card>
    </Link>
  )
}
