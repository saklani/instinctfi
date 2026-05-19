/**
 * Diagnostic: quote + execute each leg of a vault's composition via Jupiter
 * RFQ, using the local Solana keypair as taker.
 *
 * Usage:
 *   bun run scripts/test-jupiter-vault.ts [vaultName] [amountUsdc] [--quote-only]
 *
 * Defaults: NIT vault, $5, will attempt execute.
 */

import {
  Connection,
  Keypair,
  VersionedTransaction,
} from "@solana/web3.js"
import { SQL } from "bun"

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const JUPITER_URL = "https://api.jup.ag/swap/v2"
const RFQ_ONLY_EXCLUDE = "metis,iris,dflow,okx"

const vaultName = process.argv[2] ?? "NIT"
const amountUsdc = parseFloat(process.argv[3] ?? "5")
const quoteOnly = process.argv.includes("--quote-only")

const sql = new SQL(process.env.DATABASE_URL!)
const connection = new Connection(process.env.RPC_URL!, "confirmed")

const [vault] = await sql`
  SELECT id, name FROM vaults WHERE name ILIKE ${`%${vaultName}%`} LIMIT 1
` as { id: string; name: string }[]
if (!vault) {
  console.error(`Vault not found: ${vaultName}`)
  process.exit(1)
}

const composition = await sql`
  SELECT compositions.weight, stocks.address AS mint, stocks.ticker
  FROM compositions
  INNER JOIN stocks ON compositions.stock_id = stocks.id
  WHERE compositions.vault_id = ${vault.id}
` as { weight: number; mint: string; ticker: string }[]

if (composition.length === 0) {
  console.error(`Vault ${vault.name} has no composition`)
  process.exit(1)
}

const keypairText = await Bun.file(`${process.env.HOME}/.config/solana/id.json`).text()
const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keypairText)))

console.log(`Vault:  ${vault.name} (${composition.length} legs)`)
console.log(`Taker:  ${keypair.publicKey.toBase58()}`)
console.log(`Amount: $${amountUsdc} USDC`)
console.log(`Mode:   ${quoteOnly ? "QUOTE ONLY" : "QUOTE + EXECUTE"}`)
console.log()

const totalAtomic = BigInt(Math.floor(amountUsdc * 1e6))

const summary: Array<{
  ticker: string
  weight: number
  quoteStatus: number
  router?: string
  outUsd?: number
  execStatus?: number | string
  execError?: string
}> = []

for (const leg of composition) {
  const allocation = (totalAtomic * BigInt(leg.weight)) / 10_000n
  const allocationUsd = Number(allocation) / 1e6

  console.log(`── ${leg.ticker} ${leg.weight / 100}% → $${allocationUsd.toFixed(4)} (mint ${leg.mint.slice(0, 4)}…) ──`)

  if (allocation === 0n) {
    console.log("  skipped (allocation = 0)")
    summary.push({ ticker: leg.ticker, weight: leg.weight, quoteStatus: 0 })
    console.log()
    continue
  }

  const url = new URL(`${JUPITER_URL}/order`)
  url.searchParams.set("inputMint", USDC_MINT)
  url.searchParams.set("outputMint", leg.mint)
  url.searchParams.set("amount", allocation.toString())
  url.searchParams.set("taker", keypair.publicKey.toBase58())
  url.searchParams.set("excludeRouters", RFQ_ONLY_EXCLUDE)

  const orderRes = await fetch(url, {
    headers: { "x-api-key": process.env.JUPITER_API_KEY! },
  })
  console.log(`  /order status: ${orderRes.status}`)

  if (!orderRes.ok) {
    const body = await orderRes.text()
    console.log(`  ERROR: ${body}`)
    summary.push({
      ticker: leg.ticker,
      weight: leg.weight,
      quoteStatus: orderRes.status,
      execError: body,
    })
    console.log()
    continue
  }

  type OrderResponse = {
    transaction: string
    requestId: string
    outAmount: string
    router: string
    swapType?: string
    gasless?: boolean
    maker?: string
    inUsdValue?: number
    outUsdValue?: number
    signatureFeePayer?: string
    prioritizationFeePayer?: string
    rentFeePayer?: string
    lastValidBlockHeight?: number
  }
  const order = (await orderRes.json()) as OrderResponse
  console.log(`  router: ${order.router}  swapType: ${order.swapType}  gasless: ${order.gasless}`)
  console.log(`  outAmount: ${order.outAmount}  inUsd: ${order.inUsdValue}  outUsd: ${order.outUsdValue}`)
  if (order.maker) console.log(`  maker: ${order.maker}`)

  if (quoteOnly) {
    summary.push({
      ticker: leg.ticker,
      weight: leg.weight,
      quoteStatus: orderRes.status,
      router: order.router,
      outUsd: order.outUsdValue,
    })
    console.log()
    continue
  }

  // Sign locally
  const txBytes = Buffer.from(order.transaction, "base64")
  const tx = VersionedTransaction.deserialize(txBytes)
  try {
    tx.sign([keypair])
  } catch (e) {
    console.log(`  SIGN ERROR: ${e instanceof Error ? e.message : String(e)}`)
    summary.push({
      ticker: leg.ticker,
      weight: leg.weight,
      quoteStatus: orderRes.status,
      router: order.router,
      outUsd: order.outUsdValue,
      execError: `sign: ${e instanceof Error ? e.message : String(e)}`,
    })
    console.log()
    continue
  }
  const signedBase64 = Buffer.from(tx.serialize()).toString("base64")

  const execRes = await fetch(`${JUPITER_URL}/execute`, {
    method: "POST",
    headers: {
      "x-api-key": process.env.JUPITER_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      signedTransaction: signedBase64,
      requestId: order.requestId,
      lastValidBlockHeight: order.lastValidBlockHeight,
    }),
  })
  console.log(`  /execute status: ${execRes.status}`)
  const execBody = await execRes.text()
  console.log(`  ${execBody.slice(0, 500)}`)

  summary.push({
    ticker: leg.ticker,
    weight: leg.weight,
    quoteStatus: orderRes.status,
    router: order.router,
    outUsd: order.outUsdValue,
    execStatus: execRes.status,
    execError: execRes.ok ? undefined : execBody,
  })
  console.log()
}

console.log("\n=== SUMMARY ===")
for (const s of summary) {
  const tag =
    s.quoteStatus === 200 && (s.execStatus === 200 || quoteOnly)
      ? "✓"
      : "✗"
  console.log(
    `${tag} ${s.ticker.padEnd(8)} ${(s.weight / 100).toFixed(2).padStart(6)}%  quote:${s.quoteStatus}  ${
      s.router ?? ""
    }  ${s.execStatus !== undefined ? `exec:${s.execStatus}` : ""}  ${s.execError?.slice(0, 80) ?? ""}`,
  )
}
