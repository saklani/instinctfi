import { Hono } from "hono"
import { db } from "../db/index.js"
import { vaults, compositions, stocks, stockPrices } from "../db/schema.js"
import { and, eq, gte } from "drizzle-orm"
import { fetchVault as fetchSymmetryVault } from "../lib/symmetry.js"

const app = new Hono()

// ── Helpers ─────────────────────────────────────────────

interface NavSnapshot {
  nav: number | null
  delta24h: number | null
}

/** Live NAV from Symmetry on-chain via Pyth oracles. 24h delta is best-effort
 *  from the most recent prior-day basket close in stock_prices (≥50% weight
 *  coverage); when history is missing, NAV still renders and delta is null. */
async function computeNavSnapshot(
  vaultId: string,
  vaultAddress: string,
): Promise<NavSnapshot> {
  let nav: number | null = null
  try {
    const v = await fetchSymmetryVault(vaultAddress)
    if (v.price != null) nav = Number(v.price.toString())
  } catch {
    // Surface as em-dash on the client; don't fail the whole list response.
  }

  if (nav == null) return { nav: null, delta24h: null }

  const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)
  const rows = await db
    .select({
      date: stockPrices.date,
      weightBps: compositions.weightBps,
      close: stockPrices.close,
    })
    .from(compositions)
    .innerJoin(stockPrices, eq(stockPrices.stockId, compositions.stockId))
    .where(
      and(eq(compositions.vaultId, vaultId), gte(stockPrices.date, cutoff)),
    )

  const byDate = new Map<string, { sum: number; weight: number }>()
  for (const r of rows) {
    if (r.date >= today) continue
    const slot = byDate.get(r.date) ?? { sum: 0, weight: 0 }
    const w = r.weightBps / 10_000
    slot.sum += Number(r.close) * w
    slot.weight += w
    byDate.set(r.date, slot)
  }
  const series = [...byDate.entries()]
    .filter(([, v]) => v.weight >= 0.5)
    .map(([date, v]) => ({ date, value: v.sum / v.weight }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const prev = series.length > 0 ? series[series.length - 1].value : null
  const delta = prev != null && prev !== 0 ? (nav - prev) / prev : null
  return { nav, delta24h: delta }
}

async function loadCompositions(vaultId: string) {
  return db
    .select({
      weightBps: compositions.weightBps,
      stock: stocks,
    })
    .from(compositions)
    .innerJoin(stocks, eq(compositions.stockId, stocks.id))
    .where(eq(compositions.vaultId, vaultId))
}

// ── Routes ──────────────────────────────────────────────

app.get("/", async (c) => {
  const allVaults = await db.select().from(vaults)

  const result = await Promise.all(
    allVaults.map(async (vault) => {
      const [comp, snapshot] = await Promise.all([
        loadCompositions(vault.id),
        computeNavSnapshot(vault.id, vault.vaultAddress),
      ])
      return { ...vault, compositions: comp, ...snapshot }
    }),
  )

  return c.json(result)
})

app.get("/:id", async (c) => {
  const id = c.req.param("id")
  const [vault] = await db
    .select()
    .from(vaults)
    .where(eq(vaults.id, id))
    .limit(1)

  if (!vault) return c.json({ error: "Vault not found" }, 404)

  const [comp, snapshot] = await Promise.all([
    loadCompositions(id),
    computeNavSnapshot(id, vault.vaultAddress),
  ])

  return c.json({ ...vault, compositions: comp, ...snapshot })
})

// GET /api/vaults/:id/nav?days=N — weighted NAV time series
app.get("/:id/nav", async (c) => {
  const id = c.req.param("id")
  const daysParam = Number(c.req.query("days") ?? 365)
  const days = Math.min(Math.max(Number.isFinite(daysParam) ? daysParam : 365, 1), 1825)
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  const rows = await db
    .select({
      date: stockPrices.date,
      weightBps: compositions.weightBps,
      close: stockPrices.close,
    })
    .from(compositions)
    .innerJoin(stockPrices, eq(stockPrices.stockId, compositions.stockId))
    .where(and(eq(compositions.vaultId, id), gte(stockPrices.date, cutoff)))

  const compRows = await db
    .select({ stockId: compositions.stockId })
    .from(compositions)
    .where(eq(compositions.vaultId, id))
  const expectedTokens = compRows.length
  if (expectedTokens === 0) return c.json([])

  const byDate = new Map<string, { sum: number; count: number }>()
  for (const r of rows) {
    const slot = byDate.get(r.date) ?? { sum: 0, count: 0 }
    slot.sum += Number(r.close) * (r.weightBps / 10_000)
    slot.count++
    byDate.set(r.date, slot)
  }
  const series = [...byDate.entries()]
    .filter(([, v]) => v.count === expectedTokens)
    .map(([date, v]) => ({ date, value: Number(v.sum.toFixed(4)) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return c.json(series)
})

export default app
