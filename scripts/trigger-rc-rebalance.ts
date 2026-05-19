/**
 * Open a rebalance intent on RC + run keeper to process it.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/trigger-rc-rebalance.ts
 */
import { Connection, Keypair } from "@solana/web3.js"
import { SymmetryCore, KeeperMonitor } from "@symmetry-hq/sdk"

const RPC_URL = process.env.RPC_URL!
const RC_VAULT = "BT5UCXo1hhv2gndwByf4WQSJ43n6FZ1XhBA8QjGNQ9kE"
const RC_MINT  = "C8nquiV3ZLwbh3d3hBgPyYaKM5tKvYyS15u2fLPmcfV9"

const pk = process.env.PRIVATE_KEY!
const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(pk)))
const wallet = {
  publicKey: keypair.publicKey,
  signTransaction: async <T>(tx: T): Promise<T> => { (tx as any).sign([keypair]); return tx },
  signAllTransactions: async <T>(txs: T[]): Promise<T[]> => { txs.forEach((tx: any) => tx.sign([keypair])); return txs },
  payer: keypair,
}
const c = new Connection(RPC_URL, "confirmed")
const sdk = new SymmetryCore({ connection: c, network: "mainnet", priorityFee: 100_000 })

console.log("Keeper:", keypair.publicKey.toBase58())

console.log("\n1. Building rebalanceVaultTx ...")
const rebalTx = await sdk.rebalanceVaultTx({
  keeper: keypair.publicKey.toBase58(),
  vault_mint: RC_MINT,
  rebalance_slippage_bps: 500,
  per_trade_rebalance_slippage_bps: 500,
})

console.log("2. Sending ...")
const result = await sdk.signAndSendTxPayloadBatchSequence({
  txPayloadBatchSequence: rebalTx,
  wallet,
  simulateTransactions: false,
})
console.log("   result:", JSON.stringify(result).slice(0, 300))

console.log("\n3. Open rebalance intents now:")
const intents = await sdk.fetchVaultRebalanceIntents(RC_VAULT)
console.log("  count:", intents.length)
for (const i of intents) {
  const d: any = (i as any).formatted_data ?? (i as any).formatted
  console.log("   -", d?.pubkey, " type=", d?.rebalance_type, " action=", d?.current_action)
}

console.log("\n4. Running keeper to process (20 cycles)...")
const keeper = new KeeperMonitor({ wallet, connection: c, network: "mainnet", priorityFee: 100_000 })
for (let i = 0; i < 20; i++) {
  try {
    await keeper.update()
  } catch (e: any) {
    console.log(`  cycle ${i + 1}: error -`, e.message?.slice(0, 200))
  }
  // After each cycle, check basket state
  let v = await sdk.fetchVault(RC_VAULT)
  v = await sdk.loadVaultPrice(v)
  const f: any = v.formatted!
  const sol = f.composition.find((x: any) => x.mint === "So11111111111111111111111111111111111111112")
  console.log(`  cycle ${i + 1}: TVL=${v.tvl?.toString().slice(0, 8)}  SOL_in_basket(raw)=${sol?.amount ?? 0}`)
  if (Number(sol?.amount ?? 0) > 0 && f.composition.filter((x: any) => x.active && Number(x.amount) > 0).length <= 1) {
    console.log("  → basket flipped to SOL only. stopping early.")
    break
  }
  await new Promise((r) => setTimeout(r, 8000))
}

console.log("\nFinal composition:")
let vf = await sdk.fetchVault(RC_VAULT)
vf = await sdk.loadVaultPrice(vf)
const ff: any = vf.formatted!
console.log("  TVL:", vf.tvl?.toString())
for (const a of ff.composition) {
  if (!a.active) continue
  if (Number(a.amount) === 0 && Number(a.weight) === 0) continue
  console.log(`    ${a.mint}  weight_bps=${a.weight}  amount=${a.amount}`)
}
