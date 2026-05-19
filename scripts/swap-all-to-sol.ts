/**
 * Swap every non-USDC / non-SOL SPL token in the Privy wallet to SOL via Jupiter v2.
 * Skips RC + NIT vault mints (no Jupiter route).
 *
 * Usage:
 *   bun run scripts/swap-all-to-sol.ts
 */
import { Connection, PublicKey } from "@solana/web3.js"
import { PrivyClient } from "@privy-io/node"

const RPC_URL = process.env.RPC_URL!
const JUPITER_URL = "https://api.jup.ag/swap/v2"
const SOL_MINT = "So11111111111111111111111111111111111111112"
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const WALLET_ID = "m0vnd6lzap3uj691921zs0nx"

const SKIP_MINTS = new Set([
  SOL_MINT,
  USDC_MINT,
  "FXcxe5f3AwkJZRaoYFuGME7rEXS4NmBxZPYKVh3Q4bnD", // NIT vault token (empty)
  "C8nquiV3ZLwbh3d3hBgPyYaKM5tKvYyS15u2fLPmcfV9", // RC vault token (Symmetry — no Jupiter route)
])

const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
})
const c = new Connection(RPC_URL, "confirmed")

const w = await privy.wallets().get(WALLET_ID)
const taker = w.address
console.log("Wallet:", taker)
console.log("SOL before:", (await c.getBalance(new PublicKey(taker))) / 1e9)

const programs = [
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
]

type Holding = { mint: string; raw: string; ui: number }
const holdings: Holding[] = []
for (const pid of programs) {
  const { value } = await c.getParsedTokenAccountsByOwner(new PublicKey(taker), { programId: new PublicKey(pid) })
  for (const acc of value) {
    const info: any = acc.account.data.parsed.info
    const ui = Number(info.tokenAmount.uiAmount ?? 0)
    if (!ui) continue
    if (SKIP_MINTS.has(info.mint)) continue
    holdings.push({ mint: info.mint, raw: info.tokenAmount.amount, ui })
  }
}

console.log("\nWill attempt to swap (", holdings.length, "tokens):")
for (const h of holdings) console.log(" ", h.mint, " raw=", h.raw, " ui=", h.ui)

const results: { mint: string; status: string; detail?: string }[] = []
for (const h of holdings) {
  console.log(`\n— ${h.mint}  raw=${h.raw}`)
  try {
    const orderUrl = new URL(`${JUPITER_URL}/order`)
    orderUrl.searchParams.set("inputMint", h.mint)
    orderUrl.searchParams.set("outputMint", SOL_MINT)
    orderUrl.searchParams.set("amount", h.raw)
    orderUrl.searchParams.set("taker", taker)
    // Allow any router (RFQ + AMM aggregation). No excludeRouters.

    const orderRes = await fetch(orderUrl, { headers: { "x-api-key": process.env.JUPITER_API_KEY! } })
    if (!orderRes.ok) {
      const t = await orderRes.text()
      console.log("  order failed:", orderRes.status, t.slice(0, 200))
      results.push({ mint: h.mint, status: "order_failed", detail: `${orderRes.status} ${t.slice(0, 120)}` })
      continue
    }
    const order: any = await orderRes.json()
    console.log("  router:", order.router, " out:", order.outAmount, "(", Number(order.outAmount) / 1e9, "SOL )")

    const { signed_transaction } = await privy.wallets().solana().signTransaction(WALLET_ID, { transaction: order.transaction })

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
      const t = await execRes.text()
      console.log("  execute failed:", execRes.status, t.slice(0, 200))
      results.push({ mint: h.mint, status: "execute_failed", detail: `${execRes.status} ${t.slice(0, 120)}` })
      continue
    }
    const exec: any = await execRes.json()
    if (exec.status !== "Success") {
      console.log("  execute status:", exec.status, "code:", exec.code, "err:", exec.error)
      results.push({ mint: h.mint, status: "execute_nonsuccess", detail: `${exec.status} code=${exec.code} ${exec.error ?? ""}` })
      continue
    }
    console.log("  ok sig:", exec.signature, " in:", exec.inputAmountResult, " out:", exec.outputAmountResult)
    results.push({ mint: h.mint, status: "ok", detail: exec.signature })
  } catch (e: any) {
    console.log("  exception:", e.message)
    results.push({ mint: h.mint, status: "exception", detail: e.message })
  }
}

console.log("\n=== Summary ===")
for (const r of results) console.log(` ${r.status.padEnd(20)}  ${r.mint}  ${r.detail ?? ""}`)
console.log("\nSOL after:", (await c.getBalance(new PublicKey(taker))) / 1e9)
