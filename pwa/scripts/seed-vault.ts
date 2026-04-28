/**
 * Seed the vault with an initial SOL deposit from the admin wallet.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/seed-vault.ts
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = "https://api.devnet.solana.com"
const NETWORK = "devnet" as const

const VAULT_ADDRESS = "EeDideZqgCwCuQFd4241ZsZRVBcSgVYf1rPStqzov9qc"
const VAULT_MINT = "FwW1GEyvCx7q96wm4AYEGEUSFnNYozjxPwBaXWmcJeh7"
const SOL_MINT = "So11111111111111111111111111111111111111112"

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
  const connection = new Connection(RPC_URL)

  console.log("Wallet:", keypair.publicKey.toBase58())

  const balance = await connection.getBalance(keypair.publicKey)
  console.log("Balance:", balance / LAMPORTS_PER_SOL, "SOL")

  const sdk = new SymmetryCore({
    connection,
    network: NETWORK,
    priorityFee: 50_000,
  })

  // Verify vault
  console.log("\nFetching vault...")
  let vault = await sdk.fetchVault(VAULT_ADDRESS)
  console.log("  Name:", vault.formatted?.name)

  // Deposit 1 SOL
  const depositAmount = 1 * LAMPORTS_PER_SOL
  console.log(`\nDepositing ${depositAmount / LAMPORTS_PER_SOL} SOL...`)

  const buyTx = await sdk.buyVaultTx({
    buyer: wallet.publicKey.toBase58(),
    vault_mint: VAULT_MINT,
    contributions: [{ mint: SOL_MINT, amount: depositAmount }],
    rebalance_slippage_bps: 200,
    per_trade_rebalance_slippage_bps: 200,
  })

  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: buyTx,
    wallet,
  })
  console.log("  Deposit submitted.")

  // Lock deposits
  console.log("\nLocking deposits...")
  const lockTx = await sdk.lockDepositsTx({
    buyer: wallet.publicKey.toBase58(),
    vault_mint: VAULT_MINT,
  })

  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: lockTx,
    wallet,
  })
  console.log("  Deposits locked.")

  // Check vault state
  console.log("\nFetching updated vault...")
  vault = await sdk.fetchVault(VAULT_ADDRESS)
  vault = await sdk.loadVaultPrice(vault)
  console.log("  TVL:", vault.tvl?.toString())
  console.log("  Price:", vault.price?.toString())
  console.log("  Supply:", vault.formatted?.supply_outstanding)

  console.log("\nVault seeded successfully!")
}

main().catch(console.error)
