import type { ReactNode } from "react"
import { PrivyProvider } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
})

export function PrivyProviderInner({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        appearance: {
          walletChainType: "solana-only",
          theme: "dark",
          showWalletLoginFirst: true,
          walletList: ["phantom", "solflare"],
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
