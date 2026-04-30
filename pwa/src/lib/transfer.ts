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
import { getTransferInstruction } from "@solana-program/token"
import { findAssociatedTokenPda } from "@solana-program/token"

const DEFAULT_RPC_URL = import.meta.env?.VITE_RPC_URL ?? "https://api.mainnet-beta.solana.com"
const USDC_MINT = address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")

/**
 * Build a USDC transfer transaction from user wallet to server wallet.
 * Returns the encoded transaction bytes ready for Privy to sign.
 */
export async function buildUsdcTransfer(params: {
  from: string
  to: string
  amount: bigint
  rpcUrl?: string
}) {
  const rpc = createSolanaRpc(params.rpcUrl ?? DEFAULT_RPC_URL)
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

  const fromAddress = address(params.from)
  const toAddress = address(params.to)

  // Derive ATAs
  const [sourceAta] = await findAssociatedTokenPda({
    owner: fromAddress,
    mint: USDC_MINT,
  })

  const [destAta] = await findAssociatedTokenPda({
    owner: toAddress,
    mint: USDC_MINT,
  })

  const transferIx = getTransferInstruction({
    source: sourceAta,
    destination: destAta,
    authority: createNoopSigner(fromAddress),
    amount: params.amount,
  })

  const transaction = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(fromAddress, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions([transferIx], tx),
    (tx) => compileTransaction(tx),
  )

  return {
    transaction: new Uint8Array(getTransactionEncoder().encode(transaction)),
    blockhash: latestBlockhash,
  }
}
