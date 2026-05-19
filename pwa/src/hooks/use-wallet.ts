import { useQuery } from "@tanstack/react-query"
import { usePrivy } from "@privy-io/react-auth"
import {
  useWallets,
  useSignAndSendTransaction,
} from "@privy-io/react-auth/solana"

import { authenticate, type AuthResponse } from "@/lib/api"

export function useWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const { signAndSendTransaction } = useSignAndSendTransaction()

  const wallet = wallets?.[0] ?? null
  const walletAddress = wallet?.address ?? null
  const connectedClientType: "privy" | "external" | null = wallet
    ? (wallet as { walletClientType?: string }).walletClientType === "privy"
      ? "privy"
      : "external"
    : null

  // Server-side auth binding (connectedAddress → instinctAddress). The result
  // is stable per wallet, so cache forever and let React Query dedupe across
  // every useWallet() caller.
  const { data: auth } = useQuery<AuthResponse>({
    queryKey: ["auth", walletAddress, connectedClientType],
    queryFn: () =>
      authenticate({
        connectedAddress: walletAddress!,
        connectedClientType: connectedClientType!,
      }),
    enabled: authenticated && !!walletAddress && !!connectedClientType,
    staleTime: Infinity,
  })

  return {
    ready,
    authenticated,
    user,
    login,
    logout,
    userId: user?.id ?? null,
    wallet,
    walletAddress,
    signAndSendTransaction,
    instinctAddress: auth?.instinctAddress ?? null,
  }
}
