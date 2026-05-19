import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { db } from "../db/index.js"
import { holdings, stocks, vaults } from "../db/schema.js"
import { authMiddleware } from "../middleware/auth.js"
import { fetchTokenInfo } from "../lib/jupiter-prices.js"
import type { AuthEnv } from "../lib/types.js"

const app = new Hono<AuthEnv>()

app.use("*", authMiddleware)

const USDC_DECIMALS = 6

// GET /api/portfolio — per-vault positions sourced from the materialized
// `holdings` table (kept in sync by the updateHoldings Inngest function).
// Current value is priced live against Jupiter's usdPrice; everything else
// is a direct read from holdings.

app.get("/", async (c) => {
  const userId = c.get("userId")

  const rows = await db
    .select({
      vaultId: holdings.vaultId,
      basket: holdings.basket,
      investedUsdc: holdings.investedUsdc,
    })
    .from(holdings)
    .where(eq(holdings.userId, userId))

  // Drop fully-exited positions — only show vaults the user currently holds.
  const active = rows.filter((r) => Object.keys(r.basket).length > 0)

  if (active.length === 0) {
    return c.json({
      totalInvestedUsdc: 0,
      totalCurrentValueUsdc: 0,
      totalPnlUsdc: 0,
      vaults: [],
    })
  }

  const allMints = new Set<string>()
  for (const r of active) for (const mint of Object.keys(r.basket)) allMints.add(mint)

  const [vaultRows, tokenInfo, stockRows] = await Promise.all([
    db
      .select({
        id: vaults.id,
        name: vaults.name,
        description: vaults.description,
        imageUrl: vaults.imageUrl,
      })
      .from(vaults),
    fetchTokenInfo([...allMints]),
    db.select({ address: stocks.address, ticker: stocks.ticker }).from(stocks),
  ])
  const vaultsById = new Map(vaultRows.map((v) => [v.id, v]))
  const tickerByMint = new Map(stockRows.map((s) => [s.address, s.ticker]))

  type BasketRow = {
    mint: string
    ticker: string | null
    atomic: string
    uiAmount: number
    usdPrice: number | null
    usdValue: number
  }
  type VaultPosition = {
    vault: { id: string; name: string; description: string | null; imageUrl: string }
    investedUsdc: number
    currentValueUsdc: number
    pnlUsdc: number
    pnlPct: number
    basket: BasketRow[]
  }

  let totalInvested = 0
  let totalCurrent = 0
  const vaultPositions: VaultPosition[] = []

  for (const r of active) {
    const vault = vaultsById.get(r.vaultId)
    if (!vault) continue

    const invested = Number(r.investedUsdc) / 10 ** USDC_DECIMALS
    let current = 0
    const basketRows: BasketRow[] = []

    for (const [mint, atomicStr] of Object.entries(r.basket)) {
      const info = tokenInfo.get(mint)
      const decimals = info?.decimals ?? 0
      const atomic = BigInt(atomicStr)
      const ui = decimals > 0 ? Number(atomic) / 10 ** decimals : Number(atomic)
      const usdValue = info ? ui * info.usdPrice : 0
      current += usdValue
      basketRows.push({
        mint,
        ticker: tickerByMint.get(mint) ?? null,
        atomic: atomicStr,
        uiAmount: ui,
        usdPrice: info?.usdPrice ?? null,
        usdValue,
      })
    }

    totalInvested += invested
    totalCurrent += current

    vaultPositions.push({
      vault,
      investedUsdc: invested,
      currentValueUsdc: current,
      pnlUsdc: current - invested,
      pnlPct: invested > 0 ? (current - invested) / invested : 0,
      basket: basketRows,
    })
  }

  vaultPositions.sort((a, b) => b.currentValueUsdc - a.currentValueUsdc)

  return c.json({
    totalInvestedUsdc: totalInvested,
    totalCurrentValueUsdc: totalCurrent,
    totalPnlUsdc: totalCurrent - totalInvested,
    vaults: vaultPositions,
  })
})

export default app
