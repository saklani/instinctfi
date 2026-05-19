import { useQuery } from "@tanstack/react-query"

import { getPortfolio, type PortfolioVaultPosition } from "@/lib/api"
import { useWallet } from "@/hooks/use-wallet"

export type Holding = PortfolioVaultPosition

/**
 * Per-vault positions for the signed-in user. Sourced from /api/portfolio,
 * which aggregates completed deposit orders + current basket valuations.
 * Refetches every 30s so newly-settled deposits surface promptly.
 */
export function useHoldings() {
  const { authenticated } = useWallet()
  const { data, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
    enabled: authenticated,
    refetchInterval: 30_000,
  })
  return {
    holdings: (data?.vaults ?? []) as Holding[],
    totals: data
      ? {
          investedUsdc: data.totalInvestedUsdc,
          currentValueUsdc: data.totalCurrentValueUsdc,
          pnlUsdc: data.totalPnlUsdc,
        }
      : null,
    loading: isLoading,
  }
}
