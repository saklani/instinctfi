import { useQuery } from "@tanstack/react-query"
import { fetchStockByTicker, fetchStockPrices } from "../api"

export function useStockByTicker(ticker: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stock", "ticker", ticker],
    queryFn: () => fetchStockByTicker(ticker),
    enabled: !!ticker,
    staleTime: 60 * 60_000, // 1 hour
  })

  return {
    stock: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
  }
}

export function useStockPrices(stockId: string | undefined, days: number) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stock-prices", stockId, days],
    queryFn: () => fetchStockPrices(stockId!, days),
    enabled: !!stockId,
    staleTime: 5 * 60_000, // 5 min
  })

  return {
    prices: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  }
}
