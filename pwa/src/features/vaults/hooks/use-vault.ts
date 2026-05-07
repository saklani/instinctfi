import { useQuery } from "@tanstack/react-query"
import { request } from "@/lib/api"
import type { VaultResponse } from "./use-vaults"

export function useVault(id: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["vault", id],
    queryFn: () => request<VaultResponse>(`/api/vaults/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  })

  return {
    vault: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
  }
}
