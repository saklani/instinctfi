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

export function fetchStockByTicker(ticker: string): Promise<Stock> {
  return request(`/api/stocks/by-ticker/${ticker}`)
}

export function fetchStockPrices(
  id: string,
  days: number,
): Promise<StockPricePoint[]> {
  return request(`/api/stocks/${id}/prices?days=${days}`)
}
