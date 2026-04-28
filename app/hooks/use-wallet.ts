import { usePrivy, useEmbeddedSolanaWallet } from "@privy-io/expo"

export function useWallet() {
  const { isReady, user, logout } = usePrivy()
  const { wallets } = useEmbeddedSolanaWallet()

  const wallet = wallets?.[0] ?? null
  const address = wallet?.address ?? null
  const isAuthenticated = isReady && !!user

  return {
    isReady,
    isAuthenticated,
    user,
    wallet,
    address,
    logout,
    truncatedAddress: address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : null,
  }
}
