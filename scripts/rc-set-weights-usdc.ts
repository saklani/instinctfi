/**
 * Set REVERSE CHAMATH composition to 100% of a target mint (USDC or SOL).
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/rc-set-weights-usdc.ts <target_mint>
 */

import { Connection, Keypair } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = process.env.RPC_URL!
const VAULT_ADDRESS = "BT5UCXo1hhv2gndwByf4WQSJ43n6FZ1XhBA8QjGNQ9kE"
const TARGET_MINT = process.argv[2] ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

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
  const sdk = new SymmetryCore({ connection, network: "mainnet", priorityFee: 100_000 })

  console.log("Manager:", keypair.publicKey.toBase58())

  // 1. Cancel any open rebalance intents (defensive).
  const intents = await sdk.fetchVaultRebalanceIntents(VAULT_ADDRESS)
  console.log("\nOpen rebalance intents:", intents.length)
  for (const intent of intents) {
    const pubkey =
      (intent as any).formatted_data?.pubkey ??
      (intent as any).chain_data?.ownAddress?.toBase58() ??
      (intent as any).formatted?.pubkey
    if (!pubkey) continue
    console.log("  cancelling:", pubkey)
    try {
      const tx = await sdk.cancelRebalanceIntentTx({
        keeper: wallet.publicKey.toBase58(),
        rebalance_intent: pubkey,
      })
      await sdk.signAndSendTxPayloadBatchSequence({ txPayloadBatchSequence: tx, wallet, simulateTransactions: false })
      console.log("    cancelled")
    } catch (e: any) {
      console.log("    cancel error:", e.message)
    }
  }

  // 2. Fetch current composition to build the new weights vector covering every slot.
  const vault = await sdk.fetchVault(VAULT_ADDRESS)
  const composition: any[] = vault.formatted!.composition
  const activeMints = composition.filter((a) => a.active).map((a) => a.mint)
  console.log("\nActive composition slots (", activeMints.length, "):")
  for (const m of activeMints) console.log("  ", m)

  if (!activeMints.includes(TARGET_MINT)) {
    throw new Error(`Target mint slot ${TARGET_MINT} not present in composition — cannot redirect weights.`)
  }

  const token_weights = activeMints.map((mint) => ({
    mint,
    weight_bps: mint === TARGET_MINT ? 10000 : 0,
  }))

  console.log("\nProposed weights:")
  for (const w of token_weights) console.log(`  ${w.mint}  ${w.weight_bps}`)

  // 3. Submit UpdateWeights.
  const weightsTx = await sdk.updateWeightsTx(
    { vault: VAULT_ADDRESS, manager: wallet.publicKey.toBase58() },
    { token_weights },
  )
  await sdk.signAndSendTxPayloadBatchSequence({ txPayloadBatchSequence: weightsTx, wallet })
  console.log("UpdateWeights submitted")

  // 4. Verify (the SDK auto-executes if modification_delay=0; otherwise an intent is created).
  const updated = await sdk.fetchVault(VAULT_ADDRESS)
  console.log("\nUpdated composition:")
  for (const a of updated.formatted!.composition) {
    if (!a.active) continue
    console.log(`  ${a.mint}  weight_bps=${a.weight}  amount=${a.amount}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
