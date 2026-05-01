import { Connection, PublicKey } from "@solana/web3.js"

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
const ASSOCIATED_TOKEN_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"

const TRANSFER_DISC = 3
const TRANSFER_CHECKED_DISC = 12

export interface UsdcTransferDetails {
  amount: bigint
  authority: string
  destination: string
}

export function deriveUsdcAta(owner: string): string {
  const [ata] = PublicKey.findProgramAddressSync(
    [
      new PublicKey(owner).toBuffer(),
      new PublicKey(TOKEN_PROGRAM).toBuffer(),
      new PublicKey(USDC_MINT).toBuffer(),
    ],
    new PublicKey(ASSOCIATED_TOKEN_PROGRAM),
  )

  return ata.toBase58()
}

export async function getUsdcTransferDetails(
  connection: Connection,
  signature: string,
): Promise<UsdcTransferDetails | null> {
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  })

  if (!tx || tx.meta?.err) return null

  const message = tx.transaction.message
  const accountKeys = message.getAccountKeys({
    accountKeysFromLookups: tx.meta?.loadedAddresses,
  })

  for (const ix of message.compiledInstructions) {
    const programId = accountKeys.get(ix.programIdIndex)?.toBase58()

    if (programId !== TOKEN_PROGRAM && programId !== TOKEN_2022_PROGRAM) continue

    const data = ix.data
    const disc = data[0]

    if (disc === TRANSFER_DISC && data.length >= 9) {
      const destination = accountKeys.get(ix.accountKeyIndexes[1])?.toBase58()
      const authority = accountKeys.get(ix.accountKeyIndexes[2])?.toBase58()
      const amount = readU64(data, 1)

      if (destination && authority) {
        return { destination, authority, amount }
      }
    }

    if (disc === TRANSFER_CHECKED_DISC && data.length >= 17) {
      const mint = accountKeys.get(ix.accountKeyIndexes[1])?.toBase58()
      const destination = accountKeys.get(ix.accountKeyIndexes[2])?.toBase58()
      const authority = accountKeys.get(ix.accountKeyIndexes[3])?.toBase58()
      const amount = readU64(data, 1)

      if (mint === USDC_MINT && destination && authority) {
        return { destination, authority, amount }
      }
    }
  }

  return null
}

export async function verifyUsdcTransfer(
  connection: Connection,
  signature: string,
  expectedWallet: string,
  expectedAuthority?: string,
): Promise<{ valid: boolean; error?: string; details?: UsdcTransferDetails }> {
  const expectedDestination = deriveUsdcAta(expectedWallet)
  const details = await getUsdcTransferDetails(connection, signature)

  if (!details) {
    return { valid: false, error: "No matching USDC transfer found in transaction" }
  }

  if (details.destination !== expectedDestination) {
    return { valid: false, error: "Transfer was sent to the wrong destination" }
  }

  if (expectedAuthority && details.authority !== expectedAuthority) {
    return { valid: false, error: "Transfer authority does not match the authenticated wallet" }
  }

  return { valid: true, details }
}

function readU64(data: Uint8Array, offset: number): bigint {
  let value = 0n
  for (let i = 0; i < 8; i++) {
    value |= BigInt(data[offset + i]) << BigInt(i * 8)
  }
  return value
}
