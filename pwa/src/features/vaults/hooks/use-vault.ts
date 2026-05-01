import { useQuery } from "@tanstack/react-query"
import { fetchVaults, fetchVault } from "../api"

export function useVaults() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["vaults"],
    queryFn: fetchVaults,
    staleTime: 30_000,
  })

  return {
    vaults: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  }
}

export function useVault(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["vault", id],
    queryFn: () => fetchVault(id),
    enabled: !!id,
    staleTime: 30_000,
  })

  return {
    vault: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
  }
}

export function useVaultById(id: string) {
  const { vaults, loading } = useVaults()
  const vault = vaults.find((v) => v.id === id) ?? null
  return { vault, loading }
}
