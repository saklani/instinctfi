import { Connection } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

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

function extractTransactions(payload: any): string[] {
  const txs: string[] = []
  for (const batch of payload.batches) {
    for (const tx of batch.transactions) {
      txs.push(tx.tx_b64)
    }
  }
  return txs
}

export async function fetchVault(vaultAddress: string) {
  const sdk = getSDK()
  let vault = await sdk.fetchVault(vaultAddress)
  vault = await sdk.loadVaultPrice(vault)
  return vault
}

export async function hasActiveIntent(vaultAddress: string): Promise<boolean> {
  const sdk = getSDK()
  const intents = await sdk.fetchVaultRebalanceIntents(vaultAddress)
  return intents.length > 0
}

/**
 * Build the unsigned Symmetry buyVault + lockDeposits transactions for a user
 * to sign client-side. Returns base64-encoded txs in execution order.
 */
export async function buildBuyVaultTxs(params: {
  walletAddress: string
  vaultMint: string
  amountLamports: number
}): Promise<string[]> {
  const sdk = getSDK()

  const buyPayload = await sdk.buyVaultTx({
    buyer: params.walletAddress,
    vault_mint: params.vaultMint,
    contributions: [{ mint: USDC_MINT, amount: params.amountLamports }],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  const lockPayload = await sdk.lockDepositsTx({
    buyer: params.walletAddress,
    vault_mint: params.vaultMint,
  })

  return [...extractTransactions(buyPayload), ...extractTransactions(lockPayload)]
}

/**
 * Build the unsigned Symmetry sellVault transactions for a user to sign
 * client-side. Returns base64-encoded txs in execution order.
 */
export async function buildSellVaultTxs(params: {
  walletAddress: string
  vaultMint: string
  shares: number
}): Promise<string[]> {
  const sdk = getSDK()

  const sellPayload = await sdk.sellVaultTx({
    seller: params.walletAddress,
    vault_mint: params.vaultMint,
    withdraw_amount: params.shares,
    keep_tokens: [USDC_MINT],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  return extractTransactions(sellPayload)
}
