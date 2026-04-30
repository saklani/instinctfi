import { Connection, VersionedTransaction } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"
import { signAndSendTransaction } from "./privy"

const RPC_URL = process.env.RPC_URL!
const VAULT_MINT = process.env.VAULT_MINT!
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

let sdk: SymmetryCore | null = null
const connection = new Connection(RPC_URL, "confirmed")

function getSDK() {
  if (!sdk) {
    sdk = new SymmetryCore({
      connection,
      network: "mainnet",
      priorityFee: 100_000,
    })
  }
  return sdk
}

/**
 * Extract VersionedTransactions from Symmetry's TxPayloadBatchSequence
 */
function extractTransactions(payload: any): Buffer[] {
  const txs: Buffer[] = []
  for (const batch of payload.batches) {
    for (const tx of batch.transactions) {
      txs.push(Buffer.from(tx.tx_b64, "base64"))
    }
  }
  return txs
}

/**
 * Execute a deposit: buyVaultTx + lockDepositsTx
 * Signs and sends using Privy server wallet
 */
export async function executeDeposit(params: {
  walletId: string
  walletAddress: string
  amountLamports: number
}) {
  const sdk = getSDK()

  // 1. Build buy tx
  const buyPayload = await sdk.buyVaultTx({
    buyer: params.walletAddress,
    vault_mint: VAULT_MINT,
    contributions: [
      { mint: USDC_MINT, amount: params.amountLamports },
    ],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  // 2. Sign + send each tx via Privy
  const buyTxs = extractTransactions(buyPayload)
  const buySignatures: string[] = []

  for (const txBuf of buyTxs) {
    const result = await signAndSendTransaction(
      params.walletId,
      txBuf.toString("base64"),
    )
    buySignatures.push(result.hash)
  }

  // 3. Build lock tx
  const lockPayload = await sdk.lockDepositsTx({
    buyer: params.walletAddress,
    vault_mint: VAULT_MINT,
  })

  // 4. Sign + send lock
  const lockTxs = extractTransactions(lockPayload)
  const lockSignatures: string[] = []

  for (const txBuf of lockTxs) {
    const result = await signAndSendTransaction(
      params.walletId,
      txBuf.toString("base64"),
    )
    lockSignatures.push(result.hash)
  }

  return { buySignatures, lockSignatures }
}

/**
 * Execute a withdrawal: sellVaultTx
 */
export async function executeWithdraw(params: {
  walletId: string
  walletAddress: string
  amount: number // raw vault token amount
}) {
  const sdk = getSDK()

  const sellPayload = await sdk.sellVaultTx({
    seller: params.walletAddress,
    vault_mint: VAULT_MINT,
    withdraw_amount: params.amount,
    keep_tokens: [USDC_MINT],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  const sellTxs = extractTransactions(sellPayload)
  const signatures: string[] = []

  for (const txBuf of sellTxs) {
    const result = await signAndSendTransaction(
      params.walletId,
      txBuf.toString("base64"),
    )
    signatures.push(result.hash)
  }

  return { signatures }
}
