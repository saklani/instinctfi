import { useQuery } from "@tanstack/react-query"
import { address, createSolanaRpc } from "@solana/kit"
import { TOKEN_PROGRAM_ADDRESS } from "@solana-program/token"

import { useWallet } from "@/hooks/use-wallet"
import { useVaults, type VaultResponse } from "@/hooks/use-vaults"
import { isLiveVault } from "@/lib/vaults"

const RPC_URL =
  import.meta.env.VITE_RPC_URL ?? "https://api.mainnet-beta.solana.com"

export type Holding = {
  vaultId: string
  vault: VaultResponse
  /** Raw on-chain amount, atomic units. */
  balanceRaw: bigint
  /** Human-readable amount (raw / 10^decimals). */
  balanceUi: number
  /** Mirror of `vault.allTime` for the holdings table. */
  allTime: number | null
}

type ParsedTokenAccountInfo = {
  mint: string
  tokenAmount: {
    amount: string
    decimals: number
    uiAmount: number | null
    uiAmountString: string
  }
}

async function fetchTokenAccountsByMint(walletAddress: string) {
  const rpc = createSolanaRpc(RPC_URL)
  const owner = address(walletAddress)
  const { value } = await rpc
    .getTokenAccountsByOwner(
      owner,
      { programId: TOKEN_PROGRAM_ADDRESS },
      { encoding: "jsonParsed" },
    )
    .send()

  const byMint = new Map<string, ParsedTokenAccountInfo>()
  for (const account of value) {
    const info = (account.account.data as { parsed: { info: ParsedTokenAccountInfo } })
      .parsed.info
    byMint.set(info.mint, info)
  }
  return byMint
}

export function useHoldings() {
  const { walletAddress, authenticated } = useWallet()
  const { vaults, loading: vaultsLoading } = useVaults()

  const { data: byMint, isLoading: balancesLoading } = useQuery({
    queryKey: ["holdings", walletAddress] as const,
    queryFn: () => fetchTokenAccountsByMint(walletAddress!),
    enabled: !!walletAddress && authenticated,
    staleTime: 30_000,
  })

  // Show every live vault (zero balance included) so the portfolio renders a
  // full menu of what the user could hold, not just what they currently do.
  // Non-live vaults only surface if the wallet actually holds some.
  const holdings: Holding[] = []
  for (const vault of vaults) {
    if (!vault.mint) continue
    const info = byMint?.get(vault.mint)
    const balanceRaw = info ? BigInt(info.tokenAmount.amount) : 0n
    const balanceUi = info?.tokenAmount.uiAmount ?? 0
    const live = isLiveVault(vault.id)
    if (!live && balanceRaw === 0n) continue
    holdings.push({
      vaultId: vault.id,
      vault,
      balanceRaw,
      balanceUi,
      allTime: vault.allTime ?? null,
    })
  }

  return {
    holdings,
    loading: vaultsLoading || balancesLoading,
  }
}
