/**
 * Test withdraw flow using sellVaultTx.
 * Since the keeper can't mint on local (no Jupiter), we test that the
 * sellVaultTx transaction builds and sends successfully.
 *
 * On local validator, this will create the withdraw intent but the keeper
 * can't process it (no swap routes). The test verifies the tx submission works.
 *
 * 1. Start local validator: ./test/start-validator.sh
 * 2. Run deposit test first: bun run test/test-deposit.ts
 * 3. Run: bun run test/test-withdraw.ts
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
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
  const sig = await connection.requestAirdrop(keypair.publicKey, 10 * LAMPORTS_PER_SOL)
  await connection.confirmTransaction(sig)
  console.log("Balance:", (await connection.getBalance(keypair.publicKey)) / LAMPORTS_PER_SOL, "SOL")

  const sdk = new SymmetryCore({
    connection,
    network: "mainnet",
    priorityFee: 50_000,
  })

  // Step 1: Deposit first to get a rebalance intent
  console.log("\n=== Deposit 0.1 SOL ===")
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
  console.log("Buy:", buyResult.flat().every((r: string) => r !== "Error") ? "OK" : "ERRORS")

  const lockTx = await sdk.lockDepositsTx({
    buyer: wallet.publicKey.toBase58(),
    vault_mint: VAULT_MINT,
  })
  const lockResult = await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: lockTx,
    wallet,
    simulateTransactions: false,
  })
  console.log("Lock:", lockResult.flat().every((r: string) => r !== "Error") ? "OK" : "ERRORS")

  // Step 2: Try to withdraw (cancel the deposit intent via sellVaultTx)
  // Since we don't have vault tokens yet (keeper hasn't minted),
  // we test that sellVaultTx builds and submits
  console.log("\n=== Withdraw (sell) ===")
  try {
    const sellTx = await sdk.sellVaultTx({
      seller: wallet.publicKey.toBase58(),
      vault_mint: VAULT_MINT,
      withdraw_amount: 1000000, // 1 vault token (6 decimals)
      keep_tokens: [SOL_MINT],
      rebalance_slippage_bps: 500,
      per_trade_rebalance_slippage_bps: 500,
    })
    const sellResult = await sdk.signAndSendTxPayloadBatchSequence({
      txPayloadBatchSequence: sellTx,
      wallet,
      simulateTransactions: false,
    })
    console.log("Sell result:", JSON.stringify(sellResult))

    const hasError = sellResult.some((batch: string[]) => batch.some((r: string) => r === "Error"))
    if (hasError) {
      const recent = await connection.getSignaturesForAddress(keypair.publicKey, { limit: 5 })
      for (const s of recent) {
        if (s.err) {
          const tx = await connection.getTransaction(s.signature, { maxSupportedTransactionVersion: 0 })
          const errLog = tx?.meta?.logMessages?.find((l: string) => l.includes("Error"))
          if (errLog) console.log("  Failed:", errLog)
        }
      }
    } else {
      console.log("Withdrawal submitted!")
    }
  } catch (e: any) {
    console.log("Sell error:", e.message?.slice(0, 200))
  }

  console.log("\nFinal SOL:", (await connection.getBalance(keypair.publicKey)) / LAMPORTS_PER_SOL)
}

main().catch(console.error)
