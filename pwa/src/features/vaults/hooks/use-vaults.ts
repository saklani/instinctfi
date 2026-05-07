import { useQuery } from "@tanstack/react-query"
import { request } from "@/lib/api"
import type { Vault, Stock } from "@/db/schema"

export type VaultComposition = { weight: number; stock: Stock } // weight in bps

export type VaultResponse = Vault & {
  compositions: VaultComposition[]
  nav: number | null
  delta24h: number | null
}

export function useVaults() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["vaults"],
    queryFn: () => request<VaultResponse[]>("/api/vaults"),
    staleTime: 30_000,
  })

  return {
    vaults: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  }
}
