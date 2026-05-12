import { createFileRoute } from "@tanstack/react-router"

import { useLeaderboard, LeaderboardTable } from "@/features/leaderboard"
import { Column } from "@/components/ui/column"

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
})

function LeaderboardPage() {
  const { wallets, loading } = useLeaderboard()
  return (
    <Column className="animate-in fade-in-0 duration-300 gap-12 pt-12 pb-24">
      <h1>Top Wallets</h1>
      <LeaderboardTable rows={wallets} loading={loading} />
    </Column>
  )
}
