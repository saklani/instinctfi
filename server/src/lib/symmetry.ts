import { Connection } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"
import { signTransaction } from "./privy.js"

const RPC_URL = process.env.RPC_URL!
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

let sdk: SymmetryCore | null = null
const connection = new Connection(RPC_URL, "confirmed")

export function getSDK() {
  if (!sdk) {
    sdk = new SymmetryCore({
      connection,
      network: "mainnet",
      priorityFee: 100_000,
    })
  }
  return sdk
}

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
 * Fetch vault data from on-chain
 */
export async function fetchVault(vaultAddress: string) {
  const sdk = getSDK()
  let vault = await sdk.fetchVault(vaultAddress)
  vault = await sdk.loadVaultPrice(vault)
  return vault
}

/**
 * Execute a deposit: buyVaultTx + lockDepositsTx
 */
export async function executeDeposit(params: {
  walletId: string
  walletAddress: string
  vaultMint: string
  amountLamports: number
}) {
  const sdk = getSDK()

  const buyPayload = await sdk.buyVaultTx({
    buyer: params.walletAddress,
    vault_mint: params.vaultMint,
    contributions: [
      { mint: USDC_MINT, amount: params.amountLamports },
    ],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  const buyTxs = extractTransactions(buyPayload)
  const buySignatures: string[] = []

  for (const txBuf of buyTxs) {
    const { signed_transaction } = await signTransaction(
      params.walletId,
      txBuf.toString("base64"),
    )
    const sig = await connection.sendRawTransaction(
      Buffer.from(signed_transaction, "base64"),
    )
    await connection.confirmTransaction(sig, "confirmed")
    buySignatures.push(sig)
  }

  const lockPayload = await sdk.lockDepositsTx({
    buyer: params.walletAddress,
    vault_mint: params.vaultMint,
  })

  const lockTxs = extractTransactions(lockPayload)
  const lockSignatures: string[] = []

  for (const txBuf of lockTxs) {
    const { signed_transaction } = await signTransaction(
      params.walletId,
      txBuf.toString("base64"),
    )
    const sig = await connection.sendRawTransaction(
      Buffer.from(signed_transaction, "base64"),
    )
    await connection.confirmTransaction(sig, "confirmed")
    lockSignatures.push(sig)
  }

  return { buySignatures, lockSignatures }
}

/**
 * Execute a withdrawal: sellVaultTx
 */
export async function executeWithdraw(params: {
  walletId: string
  walletAddress: string
  vaultMint: string
  amount: number
}) {
  const sdk = getSDK()

  const sellPayload = await sdk.sellVaultTx({
    seller: params.walletAddress,
    vault_mint: params.vaultMint,
    withdraw_amount: params.amount,
    keep_tokens: [USDC_MINT],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  const sellTxs = extractTransactions(sellPayload)
  const signatures: string[] = []

  for (const txBuf of sellTxs) {
    const { signed_transaction } = await signTransaction(
      params.walletId,
      txBuf.toString("base64"),
    )
    const sig = await connection.sendRawTransaction(
      Buffer.from(signed_transaction, "base64"),
    )
    await connection.confirmTransaction(sig, "confirmed")
    signatures.push(sig)
  }

  return { signatures }
}
