import { useQuery } from "@tanstack/react-query"

const JUPITER_URL = "https://lite-api.jup.ag/tokens/v2/search"

export interface JupiterAudit {
  topHoldersPercentage?: number
  devBalancePercentage?: number
  devMints?: number
  isSus?: boolean
  freezeAuthorityDisabled?: boolean
}

export interface JupiterTokenStats {
  priceChange?: number
  buyVolume?: number
  sellVolume?: number
  numBuys?: number
  numSells?: number
}

export interface JupiterTokenInfo {
  mint: string
  name: string
  symbol: string
  icon?: string
  decimals: number
  holderCount: number | null
  liquidity: number | null
  mcap: number | null
  fdv: number | null
  usdPrice: number | null
  freezeAuthority: string | null
  organicScore: number
  organicScoreLabel: "low" | "medium" | "high"
  isVerified: boolean
  tags: string[]
  audit: JupiterAudit
  stats24h?: JupiterTokenStats
}

export type TokenInfoMap = Record<string, JupiterTokenInfo>

async function fetchOne(mint: string): Promise<JupiterTokenInfo | null> {
  const res = await fetch(`${JUPITER_URL}?query=${mint}`)
  if (!res.ok) throw new Error(`Jupiter ${res.status}`)
  const arr = (await res.json()) as any[]
  const e = arr.find((t) => t.id === mint) ?? arr[0]
  if (!e) return null
  return {
    mint: e.id,
    name: e.name,
    symbol: e.symbol,
    icon: e.icon,
    decimals: Number(e.decimals ?? 0),
    holderCount: e.holderCount ?? null,
    liquidity: e.liquidity ?? null,
    mcap: e.mcap ?? null,
    fdv: e.fdv ?? null,
    usdPrice: e.usdPrice ?? null,
    freezeAuthority: e.freezeAuthority ?? null,
    organicScore: Number(e.organicScore ?? 0),
    organicScoreLabel: (e.organicScoreLabel ?? "low") as JupiterTokenInfo["organicScoreLabel"],
    isVerified: Boolean(e.isVerified),
    tags: Array.isArray(e.tags) ? e.tags : [],
    audit: e.audit ?? {},
    stats24h: e.stats24h,
  }
}

async function fetchTokens(mints: string[]): Promise<TokenInfoMap> {
  if (!mints.length) return {}
  const results = await Promise.all(mints.map((m) => fetchOne(m).catch(() => null)))
  const out: TokenInfoMap = {}
  for (const t of results) {
    if (t) out[t.mint] = t
  }
  return out
}

export function useJupiterTokens(mints: string[]) {
  const key = [...mints].sort().join(",")
  const { data, isLoading, error } = useQuery({
    queryKey: ["jupiter-tokens", key],
    queryFn: () => fetchTokens(mints),
    enabled: mints.length > 0,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
  return {
    tokens: data ?? ({} as TokenInfoMap),
    loading: isLoading,
    error: error?.message ?? null,
  }
}
