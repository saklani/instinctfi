/**
 * Test direct swap within a vault (swap USDC -> xStock via Jupiter).
 * No keeper needed — vault manager executes directly.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/test-direct-swap.ts
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = process.env.RPC_URL!
const VAULT_ADDRESS = "G54nsrBx9a59YVqiqk2Sg3yX9wQauRz5MEugdWDjvmsf"
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const NVDA_MINT = "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh"

// Swap $1 USDC -> NVDAx
const AMOUNT_FROM = 1_000_000 // 1 USDC (6 decimals)
const AMOUNT_TO = 1 // minimum NVDAx to receive (will get more)

function loadKeypair(): Keypair {
  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error("Set PRIVATE_KEY env var")
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(pk)))
}

function createWallet(keypair: Keypair) {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async <T>(tx: T): Promise<T> => { (tx as any).sign([keypair]); return tx },
    signAllTransactions: async <T>(txs: T[]): Promise<T[]> => { txs.forEach((tx: any) => tx.sign([keypair])); return txs },
    payer: keypair,
  }
}

async function main() {
  const keypair = loadKeypair()
  const wallet = createWallet(keypair)
  const connection = new Connection(RPC_URL, "confirmed")

  console.log("Wallet:", keypair.publicKey.toBase58())
  console.log("Balance:", (await connection.getBalance(keypair.publicKey)) / LAMPORTS_PER_SOL, "SOL")

  const sdk = new SymmetryCore({ connection, network: "mainnet", priorityFee: 100_000 })

  // Check vault
  const vault = await sdk.fetchVault(VAULT_ADDRESS)
  console.log("Vault:", vault.formatted?.name)
  console.log("")

  const ctx = {
    vault: VAULT_ADDRESS,
    manager: wallet.publicKey.toBase58(),
  }

  console.log("Direct swap: 1 USDC -> NVDAx")
  console.log("  from:", USDC_MINT)
  console.log("  to:", NVDA_MINT)
  console.log("  amount:", AMOUNT_FROM)

  const swapTx = await sdk.makeDirectSwapTx(ctx, {
    from_token_mint: USDC_MINT,
    to_token_mint: NVDA_MINT,
    amount_from: AMOUNT_FROM,
    amount_to: AMOUNT_TO,
  })

  console.log("\nSigning and sending...")
  const result = await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: swapTx,
    wallet,
    simulateTransactions: false,
  })

  console.log("Result:", JSON.stringify(result))
  console.log("\nDone!")
}

main().catch(console.error)
