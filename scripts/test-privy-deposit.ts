/**
 * Test Privy server wallet signing + Symmetry deposit on mainnet.
 *
 * Usage:
 *   bun run scripts/test-privy-deposit.ts
 */

import { Connection } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"
import { PrivyClient } from "@privy-io/node"

const RPC_URL = process.env.RPC_URL!
const VAULT_MINT = "FXcxe5f3AwkJZRaoYFuGME7rEXS4NmBxZPYKVh3Q4bnD"
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const WALLET_ID = "m0vnd6lzap3uj691921zs0nx"
const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"

// Amount in USDC (6 decimals) — 1 USDC = 1_000_000
const AMOUNT = 1_000_000 // 1 USDC

const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
})

async function main() {
  const connection = new Connection(RPC_URL, "confirmed")

  // Get wallet address from Privy
  console.log("Fetching wallet info...")
  const wallet = await privy.wallets().get(WALLET_ID)
  const walletAddress = wallet.address
  console.log("Wallet address:", walletAddress)

  // Check USDC balance
  const { value: tokenAccounts } = await connection.getParsedTokenAccountsByOwner(
    new (await import("@solana/web3.js")).PublicKey(walletAddress),
    { mint: new (await import("@solana/web3.js")).PublicKey(USDC_MINT) },
  )
  const usdcBalance = tokenAccounts[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0
  console.log("USDC balance:", usdcBalance)

  if (usdcBalance < AMOUNT / 1e6) {
    console.error("Insufficient USDC balance. Need", AMOUNT / 1e6, "USDC")
    return
  }

  // Init Symmetry
  const sdk = new SymmetryCore({
    connection,
    network: "mainnet",
    priorityFee: 100_000,
  })

  // Step 1: Build buy tx
  console.log("\n=== Building buy tx ===")
  const buyPayload = await sdk.buyVaultTx({
    buyer: walletAddress,
    vault_mint: VAULT_MINT,
    contributions: [{ mint: USDC_MINT, amount: AMOUNT }],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  const buyTxs: string[] = []
  for (const batch of buyPayload.batches) {
    for (const tx of batch.transactions) {
      buyTxs.push(tx.tx_b64)
    }
  }
  console.log("Buy txs:", buyTxs.length)

  // Step 2: Sign via Privy, send via our RPC
  console.log("\n=== Signing and sending buy txs ===")
  for (let i = 0; i < buyTxs.length; i++) {
    console.log(`Signing buy tx ${i + 1}/${buyTxs.length}...`)
    try {
      const { signed_transaction } = await privy.wallets().solana().signTransaction(WALLET_ID, {
        transaction: buyTxs[i]!,
      })
      const sig = await connection.sendRawTransaction(Buffer.from(signed_transaction, "base64"))
      await connection.confirmTransaction(sig, "confirmed")
      console.log(`  hash: ${sig}`)
    } catch (e: any) {
      console.error(`  FAILED:`, e.message ?? e)
      return
    }
  }

  // Step 3: Build lock tx
  console.log("\n=== Building lock tx ===")
  const lockPayload = await sdk.lockDepositsTx({
    buyer: walletAddress,
    vault_mint: VAULT_MINT,
  })

  const lockTxs: string[] = []
  for (const batch of lockPayload.batches) {
    for (const tx of batch.transactions) {
      lockTxs.push(tx.tx_b64)
    }
  }
  console.log("Lock txs:", lockTxs.length)

  // Step 4: Sign via Privy, send via our RPC
  console.log("\n=== Signing and sending lock txs ===")
  for (let i = 0; i < lockTxs.length; i++) {
    console.log(`Signing lock tx ${i + 1}/${lockTxs.length}...`)
    try {
      const { signed_transaction } = await privy.wallets().solana().signTransaction(WALLET_ID, {
        transaction: lockTxs[i]!,
      })
      const sig = await connection.sendRawTransaction(Buffer.from(signed_transaction, "base64"))
      await connection.confirmTransaction(sig, "confirmed")
      console.log(`  hash: ${sig}`)
    } catch (e: any) {
      console.error(`  FAILED:`, e.message ?? e)
      return
    }
  }

  console.log("\nDone! Deposit complete.")
}

main().catch(console.error)
