import {
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createSolanaRpc,
  getTransactionEncoder,
  address,
} from "@solana/kit"
import {
  getTransferInstruction,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstructionAsync,
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
    const { value } = await rpc
      .getTokenAccountBalance(ata)
      .send()
    return Number(value.uiAmount ?? 0)
  } catch {
    return 0
  }
}

/**
 * Build a USDC transfer transaction from user wallet to server wallet.
 * Returns the encoded transaction bytes ready for Privy to sign.
 */
export async function buildUsdcTransfer(params: {
  from: string
  to: string
  amount: bigint
}) {
  const rpc = createSolanaRpc(DEFAULT_RPC_URL)
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

  const fromAddress = address(params.from)
  const toAddress = address(params.to)

  // Derive ATAs
  const [sourceAta] = await findAssociatedTokenPda({
    owner: fromAddress,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    mint: USDC_MINT,
  })

  const [destAta] = await findAssociatedTokenPda({
    owner: toAddress,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    mint: USDC_MINT,
  })

  const payer = createNoopSigner(fromAddress)

  // Create destination ATA if it doesn't exist (idempotent — no-ops if it does)
  const createAtaIx = await getCreateAssociatedTokenIdempotentInstructionAsync({
    payer,
    owner: toAddress,
    mint: USDC_MINT,
  })

  const transferIx = getTransferInstruction({
    source: sourceAta,
    destination: destAta,
    authority: payer,
    amount: params.amount,
  })

  const transaction = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(fromAddress, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions([createAtaIx, transferIx], tx),
    (tx) => compileTransaction(tx),
  )

  return {
    transaction: new Uint8Array(getTransactionEncoder().encode(transaction)),
    blockhash: latestBlockhash,
  }
}
