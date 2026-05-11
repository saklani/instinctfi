import { createFileRoute } from "@tanstack/react-router"

import { Column } from "@/components/ui/column"

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
})

function LeaderboardPage() {
  return (
    <Column className="animate-in gap-12 pt-12 pb-24 duration-300 fade-in-0">
      <Column>
        <p className="eyebrow">Leaderboard</p>
        <h1>Coming soon</h1>
        <p className="max-w-md text-muted-foreground">
          Top wallets, performance rankings, and on-chain bragging rights
          landing here shortly.
        </p>
      </Column>
    </Column>
  )
}
