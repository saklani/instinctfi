import { usePrivy } from "@privy-io/react-auth"

export function useWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy()

  return {
    ready,
    authenticated,
    user,
    login,
    logout,
    userId: user?.id ?? null,
  }
}
