import { useQuery } from "@tanstack/react-query"
import { fetchPositions } from "../api"
import { useWallet } from "@/hooks/use-wallet"

export function usePositions() {
  const { authenticated } = useWallet()

  const { data, isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: fetchPositions,
    enabled: authenticated,
    refetchInterval: 15_000,
  })

  return { positions: data ?? [], loading: isLoading }
}
