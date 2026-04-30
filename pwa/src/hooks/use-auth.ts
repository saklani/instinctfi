import { useEffect, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { authenticate } from "@/lib/api"

export function useAuth() {
  const { ready, authenticated } = usePrivy()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  useEffect(() => {
    if (!ready || !authenticated) {
      setWalletAddress(null)
      return
    }

    authenticate()
      .then((res) => setWalletAddress(res.walletAddress))
      .catch(() => setWalletAddress(null))
  }, [ready, authenticated])

  return { walletAddress }
}
