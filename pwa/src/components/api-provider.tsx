import { useEffect, type ReactNode } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { usePrivy } from "@privy-io/react-auth"
import { authenticate, setAccessTokenGetter, type AuthResponse } from "@/lib/api"
import { useWallet } from "@/hooks/use-wallet"

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = usePrivy()
  const { authenticated, wallet, walletAddress } = useWallet()
  const queryClient = useQueryClient()

  useEffect(() => {
    setAccessTokenGetter(getAccessToken)
  }, [getAccessToken])

  const { mutate: registerWallet } = useMutation({
    mutationFn: authenticate,
    onSuccess: (data: AuthResponse) => {
      // Stash so the deposit panel can read it without re-fetching.
      queryClient.setQueryData(["instinctAddress", data.userId], data.instinctAddress)
      queryClient.setQueryData(["auth"], data)
    },
  })

  useEffect(() => {
    if (!authenticated || !walletAddress) return
    const w = wallet as { walletClientType?: string } | null
    const connectedClientType =
      w?.walletClientType === "privy" ? "privy" : "external"
    registerWallet({
      connectedAddress: walletAddress,
      connectedClientType,
    })
  }, [authenticated, walletAddress, wallet, registerWallet])

  return <>{children}</>
}
