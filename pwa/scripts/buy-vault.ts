/**
 * Buy into the vault from the admin keypair.
 * Tests the full deposit + lock flow without Privy.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/buy-vault.ts [amount_sol]
 *
 * Example:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/buy-vault.ts 0.5
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = "https://api.devnet.solana.com"
const NETWORK = "devnet" as const
const VAULT_MINT = "FwW1GEyvCx7q96wm4AYEGEUSFnNYozjxPwBaXWmcJeh7"
const SOL_MINT = "So11111111111111111111111111111111111111112"

const amountSol = parseFloat(process.argv[2] ?? "0.1")

function loadKeypair(): Keypair {
  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error("Set PRIVATE_KEY env var")
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(pk)))
}

function createWallet(keypair: Keypair) {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async <T>(tx: T): Promise<T> => {
      ;(tx as any).sign([keypair])
      return tx
    },
    signAllTransactions: async <T>(txs: T[]): Promise<T[]> => {
      txs.forEach((tx: any) => tx.sign([keypair]))
      return txs
    },
    payer: keypair,
  }
}

async function main() {
  const keypair = loadKeypair()
  const wallet = createWallet(keypair)
  const connection = new Connection(RPC_URL, "confirmed")

  const balance = await connection.getBalance(keypair.publicKey)
  const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL)

  console.log("Wallet:", keypair.publicKey.toBase58())
  console.log("Balance:", balance / LAMPORTS_PER_SOL, "SOL")
  console.log("Depositing:", amountSol, "SOL (", lamports, "lamports )")
  console.log()

  if (balance < lamports + 10_000_000) {
    throw new Error("Insufficient balance")
  }

  const sdk = new SymmetryCore({ connection, network: NETWORK, priorityFee: 50_000 })

  // 1. Buy
  console.log("Building buy tx...")
  const buyTx = await sdk.buyVaultTx({
    buyer: wallet.publicKey.toBase58(),
    vault_mint: VAULT_MINT,
    contributions: [{ mint: SOL_MINT, amount: lamports }],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  console.log("Signing and sending buy tx...")
  const buyResult = await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: buyTx,
    wallet,
    simulateTransactions: false,
  })
  console.log("Buy result:", JSON.stringify(buyResult))

  // 2. Lock
  console.log("\nBuilding lock tx...")
  const lockTx = await sdk.lockDepositsTx({
    buyer: wallet.publicKey.toBase58(),
    vault_mint: VAULT_MINT,
  })

  console.log("Signing and sending lock tx...")
  const lockResult = await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: lockTx,
    wallet,
    simulateTransactions: false,
  })
  console.log("Lock result:", JSON.stringify(lockResult))

  // 3. Check balance
  const newBalance = await connection.getBalance(keypair.publicKey)
  console.log("\nNew balance:", newBalance / LAMPORTS_PER_SOL, "SOL")
  console.log("SOL spent:", (balance - newBalance) / LAMPORTS_PER_SOL)

  console.log("\nDeposit + lock complete!")
  console.log("Run the keeper to process: PRIVATE_KEY=\"$(cat ~/.config/solana/id.json)\" bun run scripts/run-keeper.ts")
}

main().catch(console.error)
