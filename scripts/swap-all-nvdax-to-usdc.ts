/**
 * Swap the full NVDAx position in a Privy wallet to USDC via Jupiter v2.
 *
 * Usage:
 *   bun --env-file=../server/.env run scripts/swap-all-nvdax-to-usdc.ts
 */
import { Connection, PublicKey } from "@solana/web3.js"
import { PrivyClient } from "@privy-io/node"

const RPC_URL = process.env.RPC_URL!
const JUPITER_URL = "https://api.jup.ag/swap/v2"
const NVDAX_MINT = "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh"
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const WALLET_ID = "hej0t71mqv9b91760l245udw"

const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
})
const c = new Connection(RPC_URL, "confirmed")

const w = await privy.wallets().get(WALLET_ID)
const taker = w.address
const owner = new PublicKey(taker)
console.log("Wallet:", taker)

async function nvdax() {
  const { value } = await c.getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(NVDAX_MINT) })
  const info = value[0]?.account.data.parsed.info
  return {
    raw: info?.tokenAmount.amount ?? "0",
    ui: Number(info?.tokenAmount.uiAmount ?? 0),
  }
}
async function usdcUi() {
  const { value } = await c.getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(USDC_MINT) })
  return Number(value[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0)
}

const before = await nvdax()
const usdcBefore = await usdcUi()
console.log("Before — NVDAx:", before.ui, " USDC:", usdcBefore)

if (BigInt(before.raw) === 0n) {
  console.log("No NVDAx to swap. Exiting.")
  process.exit(0)
}

const orderUrl = new URL(`${JUPITER_URL}/order`)
orderUrl.searchParams.set("inputMint", NVDAX_MINT)
orderUrl.searchParams.set("outputMint", USDC_MINT)
orderUrl.searchParams.set("amount", before.raw)
orderUrl.searchParams.set("taker", taker)

console.log(`\nGET /order  amount(NVDAx raw)=${before.raw}`)
const orderRes = await fetch(orderUrl, { headers: { "x-api-key": process.env.JUPITER_API_KEY! } })
if (!orderRes.ok) {
  console.error("order failed:", orderRes.status, await orderRes.text())
  process.exit(1)
}
const order: any = await orderRes.json()
console.log("  router:", order.router, " out USDC:", Number(order.outAmount) / 1e6)
console.log("  requestId:", order.requestId)

console.log("\nSigning via Privy...")
const { signed_transaction } = await privy.wallets().solana().signTransaction(WALLET_ID, { transaction: order.transaction })

console.log("POST /execute ...")
const execRes = await fetch(`${JUPITER_URL}/execute`, {
  method: "POST",
  headers: { "x-api-key": process.env.JUPITER_API_KEY!, "Content-Type": "application/json" },
  body: JSON.stringify({
    signedTransaction: signed_transaction,
    requestId: order.requestId,
    lastValidBlockHeight: order.lastValidBlockHeight,
  }),
})
if (!execRes.ok) {
  console.error("execute failed:", execRes.status, await execRes.text())
  process.exit(1)
}
const exec: any = await execRes.json()
console.log("  status:", exec.status, " sig:", exec.signature, " code:", exec.code, " error:", exec.error)
console.log("  inputAmountResult:", exec.inputAmountResult, " outputAmountResult:", exec.outputAmountResult)

if (exec.status !== "Success") process.exit(1)

const after = await nvdax()
const usdcAfter = await usdcUi()
console.log("\nAfter — NVDAx:", after.ui, " USDC:", usdcAfter)
console.log("Δ NVDAx:", after.ui - before.ui, " Δ USDC:", usdcAfter - usdcBefore)
