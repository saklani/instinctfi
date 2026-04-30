import { usePrivy } from "@privy-io/react-auth"
import {
  useWallets,
  useStandardSignAndSendTransaction,
} from "@privy-io/react-auth/solana"

export function useWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const { signAndSendTransaction } = useStandardSignAndSendTransaction()

  const wallet = wallets?.[0] ?? null
  const walletAddress = wallet?.address ?? null

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
  }
}
