/**
 * Update vault weights to 100% SOL.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/update-weights.ts
 */

import { Connection, Keypair } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = "https://api.devnet.solana.com"
const VAULT_ADDRESS = "EeDideZqgCwCuQFd4241ZsZRVBcSgVYf1rPStqzov9qc"
const SOL_MINT = "So11111111111111111111111111111111111111112"
const USDC_MINT = "USDCoctVLVnvTXBEuP9s8hntucdJokbo17RwHuNXemT"

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

  const sdk = new SymmetryCore({ connection, network: "devnet", priorityFee: 50_000 })

  console.log("Wallet:", keypair.publicKey.toBase58())
  console.log("Vault:", VAULT_ADDRESS)

  // First cancel any pending intent
  console.log("\nChecking for pending intents...")
  const intents = await sdk.fetchVaultRebalanceIntents(VAULT_ADDRESS)
  console.log("Found", intents.length, "intent(s)")

  for (const intent of intents) {
    const pubkey = (intent as any).formatted_data?.pubkey ?? (intent as any).chain_data?.ownAddress
    if (pubkey) {
      console.log("Cancelling intent:", pubkey)
      try {
        const cancelTx = await sdk.cancelRebalanceIntentTx({
          keeper: wallet.publicKey.toBase58(),
          rebalance_intent: pubkey,
        })
        await sdk.signAndSendTxPayloadBatchSequence({
          txPayloadBatchSequence: cancelTx,
          wallet,
          simulateTransactions: false,
        })
        console.log("  Cancelled.")
      } catch (e: any) {
        console.log("  Cancel failed:", e.message)
      }
    }
  }

  // Update weights to 100% SOL
  console.log("\nUpdating weights to 100% SOL...")
  const weightsTx = await sdk.updateWeightsTx(
    {
      vault: VAULT_ADDRESS,
      manager: wallet.publicKey.toBase58(),
    },
    {
      token_weights: [
        { mint: SOL_MINT, weight_bps: 10000 },
        { mint: USDC_MINT, weight_bps: 0 },
      ],
    },
  )

  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: weightsTx,
    wallet,
  })
  console.log("Weights updated: SOL 100%, USDC 0%")

  // Verify
  let vault = await sdk.fetchVault(VAULT_ADDRESS)
  vault = await sdk.loadVaultPrice(vault)
  console.log("\nVault state:")
  console.log("  TVL:", vault.tvl?.toString())
  console.log("  Supply:", vault.formatted?.supply_outstanding)
  for (const asset of vault.formatted!.composition) {
    if (!asset.active) continue
    console.log(`  ${asset.mint}: weight=${asset.weight / 100}%`)
  }
}

main().catch(console.error)
