import { useQuery } from "@tanstack/react-query"
import { usePrivy } from "@privy-io/react-auth"
import { authenticate } from "@/lib/api"

export function useAuth() {
  const { ready, authenticated } = usePrivy()

  const { data } = useQuery({
    queryKey: ["auth"],
    queryFn: authenticate,
    enabled: ready && authenticated,
    staleTime: Infinity,
  })

  return { walletAddress: data?.walletAddress ?? null }
}
