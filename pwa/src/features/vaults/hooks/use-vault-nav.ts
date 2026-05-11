import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { request } from "@/lib/api"

export type NavPoint = { date: string; value: number }

const navQuery = (vaultId: string, days: number) => ({
  queryKey: ["vault-nav", vaultId, days] as const,
  queryFn: () => request<NavPoint[]>(`/api/vaults/${vaultId}/nav?days=${days}`),
  staleTime: 5 * 60_000,
})

export function useVaultNav(vaultId: string | undefined, days = 365) {
  const { data, isLoading, error } = useQuery({
    ...navQuery(vaultId ?? "", days),
    enabled: !!vaultId,
  })

  return {
    series: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  }
}

export function useSuspenseVaultNav(vaultId: string, days = 365) {
  const { data } = useSuspenseQuery(navQuery(vaultId, days))
  return data
}
