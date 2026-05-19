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

export type TransferVerifyResult =
  | { ok: true; details: UsdcTransferDetails }
  | { ok: false; reason: "not_found"; detail: string }
  | { ok: false; reason: "tx_error"; detail: string }
  | { ok: false; reason: "no_transfer_match"; detail: string }
  | { ok: false; reason: "wrong_destination"; detail: string }
  | { ok: false; reason: "wrong_authority"; detail: string }
  | { ok: false; reason: "wrong_amount"; detail: string }

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

function readU64(data: Uint8Array, offset: number): bigint {
  let value = 0n
  for (let i = 0; i < 8; i++) {
    value |= BigInt(data[offset + i]) << BigInt(i * 8)
  }
  return value
}

/**
 * Single-shot on-chain fetch + parse. Returns structured reason so the caller
 * (Inngest worker) can distinguish retry-worthy from hard failures. Uses
 * commitment "confirmed" to match the client's submit-and-confirm level —
 * getTransaction's default is finalized which lags ~12 slots.
 */
export async function verifyUsdcTransfer(
  connection: Connection,
  signature: string,
  expectedWallet: string,
  expectedAuthority: string,
  expectedAmount: bigint,
): Promise<TransferVerifyResult> {
  const expectedDestination = deriveUsdcAta(expectedWallet)

  const tx = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  })

  if (!tx) {
    return { ok: false, reason: "not_found", detail: "Transaction not yet on-chain" }
  }
  if (tx.meta?.err) {
    return {
      ok: false,
      reason: "tx_error",
      detail: `On-chain error: ${JSON.stringify(tx.meta.err)}`,
    }
  }

  const message = tx.transaction.message
  const accountKeys = message.getAccountKeys({
    accountKeysFromLookups: tx.meta?.loadedAddresses,
  })

  let details: UsdcTransferDetails | null = null

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
        details = { destination, authority, amount }
        break
      }
    }

    // TransferChecked layout: 1 disc + 8 amount (u64 LE) + 1 decimals = 10 bytes.
    if (disc === TRANSFER_CHECKED_DISC && data.length >= 10) {
      const mint = accountKeys.get(ix.accountKeyIndexes[1])?.toBase58()
      const destination = accountKeys.get(ix.accountKeyIndexes[2])?.toBase58()
      const authority = accountKeys.get(ix.accountKeyIndexes[3])?.toBase58()
      const amount = readU64(data, 1)
      if (mint === USDC_MINT && destination && authority) {
        details = { destination, authority, amount }
        break
      }
    }
  }

  if (!details) {
    return {
      ok: false,
      reason: "no_transfer_match",
      detail: "No matching USDC transfer in tx instructions",
    }
  }

  if (details.destination !== expectedDestination) {
    return {
      ok: false,
      reason: "wrong_destination",
      detail: `Expected ${expectedDestination}, got ${details.destination}`,
    }
  }
  if (details.authority !== expectedAuthority) {
    return {
      ok: false,
      reason: "wrong_authority",
      detail: `Expected ${expectedAuthority}, got ${details.authority}`,
    }
  }
  if (details.amount !== expectedAmount) {
    return {
      ok: false,
      reason: "wrong_amount",
      detail: `Expected ${expectedAmount.toString()} atomic, got ${details.amount.toString()}`,
    }
  }

  return { ok: true, details }
}
