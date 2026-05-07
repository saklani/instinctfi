import { useQuery } from "@tanstack/react-query"

import { request } from "@/lib/api"

export type ChartPoint = {
  date: string
  value: number
}

export function useVaultNav(vaultId: string | undefined, days = 365) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["vault-nav", vaultId, days],
    queryFn: () => request<ChartPoint[]>(`/api/vaults/${vaultId}/nav?days=${days}`),
    enabled: !!vaultId,
    staleTime: 5 * 60_000,
  })
  return {
    series: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  }
}
