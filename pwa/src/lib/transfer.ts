import {
  createSolanaRpc,
  address,
} from "@solana/kit"
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token"

const DEFAULT_RPC_URL = import.meta.env.VITE_RPC_URL ?? "https://api.mainnet-beta.solana.com"
const USDC_MINT = address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")

/**
 * Fetch USDC balance for a wallet address. Returns human-readable amount (6 decimals).
 */
export async function getUsdcBalance(owner: string): Promise<number> {
  const rpc = createSolanaRpc(DEFAULT_RPC_URL)
  const ownerAddress = address(owner)

  const [ata] = await findAssociatedTokenPda({
    owner: ownerAddress,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    mint: USDC_MINT,
  })

  try {
    const { value } = await rpc.getTokenAccountBalance(ata).send()
    return Number(value.uiAmount ?? 0)
  } catch {
    return 0
  }
}
