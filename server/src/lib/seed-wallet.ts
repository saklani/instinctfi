import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js"
import { privy } from "./privy.js"

const SEED_LAMPORTS = 10_000_000 // 0.01 SOL

/**
 * Send the treasury SOL seed to a fresh user wallet. Returns the tx signature
 * on success, or `null` when no treasury is configured. The caller is
 * responsible for idempotency — this fires the transfer unconditionally.
 */
export async function seedUserWallet(
  connection: Connection,
  recipientAddress: string,
): Promise<string | null> {
  const treasuryWalletId = process.env.TREASURY_WALLET_ID
  if (!treasuryWalletId) return null

  const treasury = await privy.wallets().get(treasuryWalletId)
  const treasuryPk = new PublicKey(treasury.address)
  const recipientPk = new PublicKey(recipientAddress)

  const { blockhash } = await connection.getLatestBlockhash()

  const message = new TransactionMessage({
    payerKey: treasuryPk,
    recentBlockhash: blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: treasuryPk,
        toPubkey: recipientPk,
        lamports: SEED_LAMPORTS,
      }),
    ],
  }).compileToV0Message()

  const tx = new VersionedTransaction(message)
  const txBase64 = Buffer.from(tx.serialize()).toString("base64")

  const { signed_transaction } = await privy
    .wallets()
    .solana()
    .signTransaction(treasuryWalletId, { transaction: txBase64 })

  const signature = await connection.sendRawTransaction(
    Buffer.from(signed_transaction, "base64"),
  )
  await connection.confirmTransaction(signature, "confirmed")

  return signature
}
