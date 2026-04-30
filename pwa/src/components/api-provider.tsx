import { createContext, useContext, useEffect, type ReactNode } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { setAccessTokenGetter } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

const WalletContext = createContext<string | null>(null)

export function useServerWallet() {
  return useContext(WalletContext)
}

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = usePrivy()
  const { walletAddress } = useAuth()

  useEffect(() => {
    setAccessTokenGetter(getAccessToken)
  }, [getAccessToken])

  return (
    <WalletContext.Provider value={walletAddress}>
      {children}
    </WalletContext.Provider>
  )
}
