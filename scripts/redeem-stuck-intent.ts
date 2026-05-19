/**
 * Redeem tokens + claim bounty on a stuck rebalance intent.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/redeem-stuck-intent.ts <intent_address>
 */
import { Connection, Keypair } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = process.env.RPC_URL!
const INTENT = process.argv[2]
if (!INTENT) throw new Error("pass intent address")

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

const keypair = loadKeypair()
const wallet = createWallet(keypair)
const connection = new Connection(RPC_URL, "confirmed")
const sdk = new SymmetryCore({ connection, network: "mainnet", priorityFee: 100_000 })

console.log("Keeper:", keypair.publicKey.toBase58())

console.log("\n1) redeemTokensTx ...")
try {
  const rTx = await sdk.redeemTokensTx({ keeper: wallet.publicKey.toBase58(), rebalance_intent: INTENT })
  const r = await sdk.signAndSendTxPayloadBatchSequence({ txPayloadBatchSequence: rTx, wallet, simulateTransactions: false })
  console.log("   result:", JSON.stringify(r))
} catch (e: any) {
  console.log("   redeemTokens error:", e.message)
}

console.log("\n2) claimBountyTx ...")
try {
  const cb = await (sdk as any).claimBountyTx({ keeper: wallet.publicKey.toBase58(), rebalance_intent: INTENT })
  const r = await sdk.signAndSendTxPayloadBatchSequence({ txPayloadBatchSequence: cb, wallet, simulateTransactions: false })
  console.log("   result:", JSON.stringify(r))
} catch (e: any) {
  console.log("   claimBounty error:", e.message)
}

console.log("\n3) cancelRebalanceIntentTx (final fallback) ...")
try {
  const cx = await sdk.cancelRebalanceIntentTx({ keeper: wallet.publicKey.toBase58(), rebalance_intent: INTENT })
  const r = await sdk.signAndSendTxPayloadBatchSequence({ txPayloadBatchSequence: cx, wallet, simulateTransactions: false })
  console.log("   result:", JSON.stringify(r))
} catch (e: any) {
  console.log("   cancel error:", e.message)
}

console.log("\nDone. Re-fetch intents:")
const left = await sdk.fetchVaultRebalanceIntents("BT5UCXo1hhv2gndwByf4WQSJ43n6FZ1XhBA8QjGNQ9kE")
console.log("  remaining:", left.length)
