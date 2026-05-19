/**
 * Read-only Jupiter v2 /order probe. Validates auth + response shape before
 * we wire up /execute and the production router. Does NOT submit any tx.
 *
 * Usage:
 *   bun run scripts/test-jupiter-order.ts [usdc_amount]
 */

const JUPITER_URL = "https://api.jup.ag/swap/v2"
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const NVDAX_MINT = "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh"
const TAKER = "3Y5dYzQGsXRTKiuZQPTUQvH7XZP8nBPRwi5LSRitGPaZ"

const amountUsdc = parseFloat(process.argv[2] ?? "10")
const amountAtomic = Math.floor(amountUsdc * 1e6)

const url = new URL(`${JUPITER_URL}/order`)
url.searchParams.set("inputMint", USDC_MINT)
url.searchParams.set("outputMint", NVDAX_MINT)
url.searchParams.set("amount", amountAtomic.toString())
url.searchParams.set("taker", TAKER)

console.log("GET", url.toString().replace(/x-api-key=[^&]+/, "x-api-key=***"))
const res = await fetch(url, {
  headers: { "x-api-key": process.env.JUPITER_API_KEY! },
})

console.log("status:", res.status)
const body = await res.text()

try {
  const json = JSON.parse(body)
  // Print everything except the (long) raw tx
  const { transaction, ...rest } = json
  console.log(JSON.stringify(rest, null, 2))
  console.log(
    "transaction:",
    transaction ? `<base64, ${transaction.length} chars>` : null,
  )
} catch {
  console.log(body)
}
