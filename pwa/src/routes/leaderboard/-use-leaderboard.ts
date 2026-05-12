import { useQuery } from "@tanstack/react-query"

import { request } from "@/lib/api"

export type LeaderboardEntry = {
  address: string
  vaultCount: number
  valueUsd: number
}

export function useLeaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"] as const,
    queryFn: () =>
      request<{ wallets: LeaderboardEntry[] }>("/api/leaderboard"),
    staleTime: 60_000,
  })
  return {
    wallets: data?.wallets ?? [],
    loading: isLoading,
  }
}
