import { useEffect, type ReactNode } from "react"
import { useMutation } from "@tanstack/react-query"
import { usePrivy } from "@privy-io/react-auth"
import { authenticate, setAccessTokenGetter } from "@/lib/api"
import { useWallet } from "@/hooks/use-wallet"

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = usePrivy()
  const { authenticated, walletAddress } = useWallet()

  useEffect(() => {
    setAccessTokenGetter(getAccessToken)
  }, [getAccessToken])

  const { mutate: registerWallet } = useMutation({
    mutationFn: authenticate,
  })

  useEffect(() => {
    if (authenticated && walletAddress) {
      registerWallet(walletAddress)
    }
  }, [authenticated, walletAddress, registerWallet])

  return <>{children}</>
}
