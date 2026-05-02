import { useQuery } from "@tanstack/react-query"

const JUPITER_URL = "https://lite-api.jup.ag/price/v3"

export interface JupiterPrice {
  usdPrice: number
  /** Decimal fraction, e.g. 0.023 = +2.3 % */
  priceChange24h: number
}

export type PriceMap = Record<string, JupiterPrice>

async function fetchPrices(mints: string[]): Promise<PriceMap> {
  if (!mints.length) return {}
  const res = await fetch(`${JUPITER_URL}?ids=${mints.join(",")}&showExtraInfo=true`)
  if (!res.ok) throw new Error(`Jupiter ${res.status}`)
  const json = await res.json()

  const out: PriceMap = {}
  for (const mint of mints) {
    const e = json[mint]
    if (!e) continue
    const price = Number(e.usdPrice ?? 0)
    // Jupiter returns priceChange24h as a raw %, e.g. 1.3 for +1.3 %.
    // Normalise to a decimal fraction so the rest of the app can use it directly.
    const raw = Number(e.priceChange24h ?? 0)
    out[mint] = { usdPrice: price, priceChange24h: raw / 100 }
  }
  return out
}

export function useJupiterPrices(mints: string[]) {
  const key = [...mints].sort().join(",")
  const { data, isLoading, error } = useQuery({
    queryKey: ["jupiter-prices", key],
    queryFn: () => fetchPrices(mints),
    enabled: mints.length > 0,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
  return { prices: data ?? ({} as PriceMap), loading: isLoading, error: error?.message ?? null }
}
