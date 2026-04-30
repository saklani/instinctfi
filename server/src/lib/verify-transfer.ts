import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js"

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"

// SPL Token transfer instruction discriminator = 3
// transferChecked instruction discriminator = 12
const TRANSFER_DISC = 3
const TRANSFER_CHECKED_DISC = 12

export async function verifyUsdcTransfer(
  connection: Connection,
  signature: string,
  expectedDestination: string,
  expectedAmount: bigint,
): Promise<{ valid: boolean; error?: string }> {
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  })

  if (!tx) return { valid: false, error: "Transaction not found" }
  if (tx.meta?.err) return { valid: false, error: "Transaction failed on-chain" }

  // Get all account keys (including lookup table resolved)
  const message = tx.transaction.message
  const accountKeys = message.getAccountKeys({
    accountKeysFromLookups: tx.meta?.loadedAddresses,
  })

  // Scan instructions for SPL token transfer to our wallet
  for (const ix of message.compiledInstructions) {
    const programId = accountKeys.get(ix.programIdIndex)?.toBase58()

    if (programId !== TOKEN_PROGRAM && programId !== TOKEN_2022_PROGRAM) continue

    const data = ix.data
    const disc = data[0]

    if (disc === TRANSFER_DISC && data.length >= 9) {
      // transfer(amount: u64) — accounts: [source, destination, authority]
      const destination = accountKeys.get(ix.accountKeyIndexes[1])?.toBase58()
      const amount = readU64(data, 1)

      if (destination === expectedDestination && amount === expectedAmount) {
        return { valid: true }
      }
    }

    if (disc === TRANSFER_CHECKED_DISC && data.length >= 17) {
      // transferChecked(amount: u64, decimals: u8) — accounts: [source, mint, destination, authority]
      const mint = accountKeys.get(ix.accountKeyIndexes[1])?.toBase58()
      const destination = accountKeys.get(ix.accountKeyIndexes[2])?.toBase58()
      const amount = readU64(data, 1)

      if (
        mint === USDC_MINT &&
        destination === expectedDestination &&
        amount === expectedAmount
      ) {
        return { valid: true }
      }
    }
  }

  return { valid: false, error: "No matching USDC transfer found in transaction" }
}

function readU64(data: Uint8Array, offset: number): bigint {
  let value = 0n
  for (let i = 0; i < 8; i++) {
    value |= BigInt(data[offset + i]) << BigInt(i * 8)
  }
  return value
}
