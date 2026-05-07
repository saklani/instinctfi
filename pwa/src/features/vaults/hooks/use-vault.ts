import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { request } from "@/lib/api"
import type { VaultResponse } from "./use-vaults"

const vaultQuery = (id: string) => ({
  queryKey: ["vault", id] as const,
  queryFn: () => request<VaultResponse>(`/api/vaults/${id}`),
  staleTime: 30_000,
})

export function useVault(id: string | undefined) {
  const { data, isLoading, error } = useQuery({
    ...vaultQuery(id ?? ""),
    enabled: !!id,
  })

  return {
    vault: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
  }
}

export function useSuspenseVault(id: string) {
  const { data } = useSuspenseQuery(vaultQuery(id))
  return data
}
