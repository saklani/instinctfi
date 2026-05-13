import { createFileRoute } from "@tanstack/react-router"

import { LeaderboardTable } from "./-leaderboard-table"
import { Column } from "@/components/ui/column"

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
})

function LeaderboardPage() {
  return (
    <Column className="animate-in fade-in-0 duration-300 gap-12 pt-12 pb-24">
      <Column className="gap-2">
        <p className="text-sm text-muted-foreground font-heading">LEADERBOARD</p>
        <h1>Top Wallets</h1>
      </Column>
      <LeaderboardTable />
    </Column>
  )
}
