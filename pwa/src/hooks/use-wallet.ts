import { useCallback } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useWallets } from "@privy-io/react-auth/solana"
import { PublicKey, VersionedTransaction } from "@solana/web3.js"

export function useWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { wallets } = useWallets()

  const wallet = wallets?.[0] ?? null
  const address = wallet?.address ?? null

  /**
   * Returns a wallet adapter compatible with Symmetry SDK's expected interface:
   *   { publicKey, signTransaction(tx), signAllTransactions(txs) }
   *
   * Symmetry passes VersionedTransaction objects.
   * Privy expects { transaction: Uint8Array } and returns { signedTransaction: Uint8Array }.
   */
  const getWalletAdapter = useCallback(async () => {
    if (!wallet || !address) throw new Error("No wallet connected")

    const pubkey = new PublicKey(address)

    return {
      publicKey: pubkey,

      signTransaction: async (tx: VersionedTransaction) => {
        const bytes = tx.serialize()
        const result = await wallet.signTransaction({
          transaction: bytes,
          chain: "solana:mainnet",
        })
        return VersionedTransaction.deserialize(result.signedTransaction)
      },

      signAllTransactions: async (txs: VersionedTransaction[]) => {
        // Privy supports variadic signTransaction(...inputs)
        const inputs = txs.map((tx) => ({
          transaction: tx.serialize(),
          chain: "solana:mainnet" as const,
        }))
        const results = await wallet.signTransaction(...inputs)
        // Variadic returns an array
        const resultsArray = Array.isArray(results) ? results : [results]
        return resultsArray.map((r: any) =>
          VersionedTransaction.deserialize(r.signedTransaction),
        )
      },
    }
  }, [wallet, address])

  return {
    ready,
    authenticated,
    user,
    wallet,
    address,
    login,
    logout,
    getWalletAdapter,
    truncatedAddress: address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : null,
  }
}
