const JUPITER_TOKEN_SEARCH = "https://lite-api.jup.ag/tokens/v2/search"

export type TokenInfo = {
  usdPrice: number
  decimals: number
  symbol: string
}

/**
 * Batched lookup of current USD price + decimals for a set of mints via
 * Jupiter's token-search endpoint. Missing entries (no usdPrice) are
 * omitted; caller treats absence as "uncoverable" and fails appropriately.
 */
export async function fetchTokenInfo(
  mints: string[],
): Promise<Map<string, TokenInfo>> {
  if (mints.length === 0) return new Map()
  const url = `${JUPITER_TOKEN_SEARCH}?query=${mints.join(",")}`
  const res = await fetch(url)
  if (!res.ok) return new Map()
  const arr = (await res.json()) as Array<{
    id: string
    usdPrice?: number
    decimals?: number
    symbol?: string
  }>
  const map = new Map<string, TokenInfo>()
  for (const t of arr) {
    if (t.usdPrice != null && t.decimals != null) {
      map.set(t.id, {
        usdPrice: t.usdPrice,
        decimals: t.decimals,
        symbol: t.symbol ?? "",
      })
    }
  }
  return map
}
