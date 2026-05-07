import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { usePrivy } from "@privy-io/react-auth"
import { authenticate, getTreasury, setAccessTokenGetter } from "@/lib/api"
import { useWallet } from "@/hooks/use-wallet"

const TreasuryContext = createContext<string | null>(null)

export function useTreasuryAddress() {
  return useContext(TreasuryContext)
}

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = usePrivy()
  const { authenticated, walletAddress } = useWallet()

  useEffect(() => {
    setAccessTokenGetter(getAccessToken)
  }, [getAccessToken])

  const { data: treasury } = useQuery({
    queryKey: ["treasury"],
    queryFn: getTreasury,
    staleTime: Infinity,
  })

  const { mutate: registerWallet } = useMutation({
    mutationFn: authenticate,
  })

  useEffect(() => {
    if (authenticated && walletAddress) {
      registerWallet(walletAddress)
    }
  }, [authenticated, walletAddress, registerWallet])

  return (
    <TreasuryContext.Provider value={treasury?.address ?? null}>
      {children}
    </TreasuryContext.Provider>
  )
}
