import { useQuery } from "@tanstack/react-query"

import { request } from "@/lib/api"
import type { Stock } from "@/db/schema"

export type { Stock }

export interface StockPricePoint {
  date: string // YYYY-MM-DD
  open: string
  high: string
  low: string
  close: string
}

export function useStockByTicker(ticker: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stock", "ticker", ticker],
    queryFn: () => request<Stock>(`/api/stocks/by-ticker/${ticker}`),
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
    queryFn: () => request<StockPricePoint[]>(`/api/stocks/${stockId}/prices?days=${days}`),
    enabled: !!stockId,
    staleTime: 5 * 60_000, // 5 min
  })
  return {
    prices: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  }
}
