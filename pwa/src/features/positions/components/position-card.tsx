import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRaw } from "@/lib/format"
import { usePositions } from "../hooks/use-positions"

export function PositionCard({ vaultId }: { vaultId: string }) {
  const { positions } = usePositions()
  const position = positions.find((p) => p.vaultId === vaultId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Position</CardTitle>
      </CardHeader>
      <CardContent>
          <span className="text-2xl font-semibold">{formatRaw(position?.amount ?? "0")}</span>
      </CardContent>
    </Card>
  )
}
