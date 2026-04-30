/**
 * Cancel a stuck rebalance intent.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/cancel-intent.ts
 */

import { Connection, Keypair } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com"
const INTENT_ADDRESS = process.argv[2] ?? "8o2yzdK1jkwEPQJxx37UgwiQFKy3RbwCAxQJkFSVrmEZ"
const NETWORK = (process.env.NETWORK ?? "mainnet") as "mainnet" | "devnet"

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

  console.log("Wallet:", keypair.publicKey.toBase58())
  console.log("Cancelling intent:", INTENT_ADDRESS)

  const sdk = new SymmetryCore({ connection, network: NETWORK, priorityFee: 100_000 })

  const cancelTx = await sdk.cancelRebalanceIntentTx({
    keeper: wallet.publicKey.toBase58(),
    rebalance_intent: INTENT_ADDRESS,
  })

  const result = await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: cancelTx,
    wallet,
    simulateTransactions: false,
  })

  console.log("Result:", JSON.stringify(result))
  console.log("Done!")
}

main().catch(console.error)
