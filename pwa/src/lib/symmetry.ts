import { Connection, VersionedTransaction } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = import.meta.env.VITE_RPC_URL ?? "https://api.devnet.solana.com"
const NETWORK = "mainnet" as const
const SOL_MINT = "So11111111111111111111111111111111111111112"

let sdk: SymmetryCore | null = null

const connection = new Connection(RPC_URL, "confirmed")

export function getSDK() {
  if (!sdk) {
    sdk = new SymmetryCore({
      connection,
      network: NETWORK,
      priorityFee: 50_000,
    })
  }
  return sdk
}

export async function fetchVaultData(vaultAddress: string) {
  const sdk = getSDK()
  let vault = await sdk.fetchVault(vaultAddress)
  vault = await sdk.loadVaultPrice(vault)
  return vault
}

/**
 * Extract VersionedTransactions from Symmetry's TxPayloadBatchSequence.
 * Returns a flat ordered array of transactions across all batches.
 */
function extractTransactions(payload: any): VersionedTransaction[] {
  const txs: VersionedTransaction[] = []
  for (const batch of payload.batches) {
    for (const tx of batch.transactions) {
      txs.push(VersionedTransaction.deserialize(Buffer.from(tx.tx_b64, "base64")))
    }
  }
  return txs
}

/**
 * Sign and send a VersionedTransaction using Privy wallet.
 * Uses signAndSendTransaction which handles everything in one call.
 */
async function signAndSend(
  wallet: any,
  tx: VersionedTransaction,
): Promise<string> {
  const serialized = tx.serialize()

  const result = await wallet.signAndSendTransaction({
    transaction: serialized,
    chain: "solana:mainnet",
    options: {
      skipPreflight: true,
    },
  })

  const signature = typeof result.signature === "string"
    ? result.signature
    : Buffer.from(result.signature).toString("base64")

  console.log("[symmetry] tx sent:", signature)
  return signature
}

export async function investInVault(params: {
  buyerAddress: string
  vaultMint: string
  amountLamports: number
  wallet: any // Privy ConnectedStandardSolanaWallet
}) {
  const sdk = getSDK()

  console.log("[invest] Building buy tx...", {
    buyer: params.buyerAddress,
    vault_mint: params.vaultMint,
    amount: params.amountLamports,
  })

  // 1. Build buy payload via Symmetry SDK
  const buyPayload = await sdk.buyVaultTx({
    buyer: params.buyerAddress,
    vault_mint: params.vaultMint,
    contributions: [
      { mint: SOL_MINT, amount: params.amountLamports },
    ],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  // 2. Extract and send buy transactions sequentially
  const buyTxs = extractTransactions(buyPayload)
  console.log(`[invest] Sending ${buyTxs.length} buy transaction(s)...`)

  for (let i = 0; i < buyTxs.length; i++) {
    console.log(`[invest] Signing buy tx ${i + 1}/${buyTxs.length}...`)
    await signAndSend(params.wallet, buyTxs[i])
  }

  console.log("[invest] Buy done. Building lock tx...")

  // 3. Build lock payload
  const lockPayload = await sdk.lockDepositsTx({
    buyer: params.buyerAddress,
    vault_mint: params.vaultMint,
  })

  // 4. Extract and send lock transactions
  const lockTxs = extractTransactions(lockPayload)
  console.log(`[invest] Sending ${lockTxs.length} lock transaction(s)...`)

  for (let i = 0; i < lockTxs.length; i++) {
    console.log(`[invest] Signing lock tx ${i + 1}/${lockTxs.length}...`)
    await signAndSend(params.wallet, lockTxs[i])
  }

  console.log("[invest] Done!")
}

export async function withdrawFromVault(params: {
  sellerAddress: string
  vaultMint: string
  amount: number // raw vault token amount (6 decimals)
  wallet: any
}) {
  const sdk = getSDK()

  console.log("[withdraw] Building sell tx...", {
    seller: params.sellerAddress,
    vault_mint: params.vaultMint,
    amount: params.amount,
  })

  const sellPayload = await sdk.sellVaultTx({
    seller: params.sellerAddress,
    vault_mint: params.vaultMint,
    withdraw_amount: params.amount,
    keep_tokens: [SOL_MINT],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  const sellTxs = extractTransactions(sellPayload)
  console.log(`[withdraw] Sending ${sellTxs.length} sell transaction(s)...`)

  for (let i = 0; i < sellTxs.length; i++) {
    console.log(`[withdraw] Signing sell tx ${i + 1}/${sellTxs.length}...`)
    await signAndSend(params.wallet, sellTxs[i])
  }

  console.log("[withdraw] Done!")
}
