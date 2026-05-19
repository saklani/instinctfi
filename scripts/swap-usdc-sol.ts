/**
 * Swap USDC -> SOL in the Privy wallet via Jupiter v2 /order + /execute.
 *
 * Usage:
 *   bun run scripts/swap-usdc-sol.ts [usdc_amount]   # default: 50
 */
import { Connection, PublicKey } from "@solana/web3.js"
import { PrivyClient } from "@privy-io/node"

const RPC_URL = process.env.RPC_URL!
const JUPITER_URL = "https://api.jup.ag/swap/v2"
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const SOL_MINT = "So11111111111111111111111111111111111111112"
const WALLET_ID = "m0vnd6lzap3uj691921zs0nx"

const amountUsdc = parseFloat(process.argv[2] ?? "50")
const amountAtomic = Math.floor(amountUsdc * 1e6).toString()

const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
})

const c = new Connection(RPC_URL, "confirmed")
const wallet = await privy.wallets().get(WALLET_ID)
const taker = wallet.address
console.log("Wallet:", taker)

async function lamports() {
  return await c.getBalance(new PublicKey(taker))
}
async function usdcUi() {
  const { value } = await c.getParsedTokenAccountsByOwner(new PublicKey(taker), { mint: new PublicKey(USDC_MINT) })
  return value[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0
}

const solBefore = (await lamports()) / 1e9
const usdcBefore = await usdcUi()
console.log("Before — SOL:", solBefore, " USDC:", usdcBefore)

const orderUrl = new URL(`${JUPITER_URL}/order`)
orderUrl.searchParams.set("inputMint", USDC_MINT)
orderUrl.searchParams.set("outputMint", SOL_MINT)
orderUrl.searchParams.set("amount", amountAtomic)
orderUrl.searchParams.set("taker", taker)

console.log("\nGET /order  amount(USDC atomic)=", amountAtomic)
const orderRes = await fetch(orderUrl, { headers: { "x-api-key": process.env.JUPITER_API_KEY! } })
if (!orderRes.ok) {
  console.error("order failed:", orderRes.status, await orderRes.text())
  process.exit(1)
}
const order: any = await orderRes.json()
console.log("  router:", order.router, " maker:", order.maker ?? "(none)", " outAmount:", order.outAmount, "(", Number(order.outAmount) / 1e9, "SOL )")
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

const solAfter = (await lamports()) / 1e9
const usdcAfter = await usdcUi()
console.log("\nAfter — SOL:", solAfter, " USDC:", usdcAfter)
console.log("Δ SOL:", solAfter - solBefore, " Δ USDC:", usdcAfter - usdcBefore)
