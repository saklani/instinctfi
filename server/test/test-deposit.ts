/**
 * Test deposit flow against local validator.
 *
 * 1. Start local validator first: ./test/start-validator.sh
 * 2. Run: bun run test/test-deposit.ts
 *
 * Will iteratively report missing accounts — add them to start-validator.sh and restart.
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC = "http://localhost:8899"
const VAULT_ADDRESS = "G54nsrBx9a59YVqiqk2Sg3yX9wQauRz5MEugdWDjvmsf"
const VAULT_MINT = "FXcxe5f3AwkJZRaoYFuGME7rEXS4NmBxZPYKVh3Q4bnD"
const SOL_MINT = "So11111111111111111111111111111111111111112"

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
  const connection = new Connection(RPC, "confirmed")
  const keypair = Keypair.generate()
  const wallet = createWallet(keypair)

  console.log("Test wallet:", keypair.publicKey.toBase58())

  // Airdrop
  console.log("Airdropping SOL...")
  const sig = await connection.requestAirdrop(keypair.publicKey, 10 * LAMPORTS_PER_SOL)
  await connection.confirmTransaction(sig)
  console.log("Balance:", (await connection.getBalance(keypair.publicKey)) / LAMPORTS_PER_SOL, "SOL")

  const sdk = new SymmetryCore({
    connection,
    network: "mainnet",
    priorityFee: 50_000,
  })

  // Fetch vault
  console.log("\nFetching vault...")
  const vault = await sdk.fetchVault(VAULT_ADDRESS)
  console.log("Vault:", vault.formatted?.name, "Tokens:", vault.numTokens)

  // Step 1: Add bounty
  console.log("\n=== Step 1: Add bounty ===")
  try {
    const bountyTx = await sdk.addBountyTx({
      depositor: wallet.publicKey.toBase58(),
      vault: VAULT_ADDRESS,
      amount: 0.01 * LAMPORTS_PER_SOL,
    })
    const bountyResult = await sdk.signAndSendTxPayloadBatchSequence({
      txPayloadBatchSequence: bountyTx,
      wallet,
      simulateTransactions: false,
    })
    console.log("Bounty result:", JSON.stringify(bountyResult))
  } catch (e: any) {
    console.log("Bounty error:", e.message?.slice(0, 200))
  }

  // Step 2: Buy
  console.log("\n=== Step 2: Buy (deposit 0.1 SOL) ===")
  try {
    const buyTx = await sdk.buyVaultTx({
      buyer: wallet.publicKey.toBase58(),
      vault_mint: VAULT_MINT,
      contributions: [{ mint: SOL_MINT, amount: 0.1 * LAMPORTS_PER_SOL }],
      rebalance_slippage_bps: 500,
      per_trade_rebalance_slippage_bps: 500,
    })
    const buyResult = await sdk.signAndSendTxPayloadBatchSequence({
      txPayloadBatchSequence: buyTx,
      wallet,
      simulateTransactions: false,
    })
    console.log("Buy result:", JSON.stringify(buyResult))

    // Check for errors in result
    const hasError = buyResult.some((batch: string[]) => batch.some((r: string) => r === "Error"))
    if (hasError) {
      // Get the failed tx logs
      for (const batch of buyResult) {
        for (const r of batch) {
          if (r === "Error") continue
          // Success sigs won't help, check recent failed txs
        }
      }
      const recent = await connection.getSignaturesForAddress(
        keypair.publicKey,
        { limit: 5 },
      )
      for (const s of recent) {
        if (s.err) {
          const tx = await connection.getTransaction(s.signature, { maxSupportedTransactionVersion: 0 })
          const errLog = tx?.meta?.logMessages?.find((l: string) => l.includes("Error"))
          if (errLog) console.log("  Failed:", errLog)
        }
      }
    }
  } catch (e: any) {
    console.log("Buy error:", e.message?.slice(0, 200))
  }

  // Step 3: Lock
  console.log("\n=== Step 3: Lock ===")
  try {
    const lockTx = await sdk.lockDepositsTx({
      buyer: wallet.publicKey.toBase58(),
      vault_mint: VAULT_MINT,
    })
    const lockResult = await sdk.signAndSendTxPayloadBatchSequence({
      txPayloadBatchSequence: lockTx,
      wallet,
      simulateTransactions: false,
    })
    console.log("Lock result:", JSON.stringify(lockResult))
  } catch (e: any) {
    console.log("Lock error:", e.message?.slice(0, 200))
  }

  console.log("\nFinal balance:", (await connection.getBalance(keypair.publicKey)) / LAMPORTS_PER_SOL, "SOL")
}

main().catch(console.error)
