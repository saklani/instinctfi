import { Hono } from "hono"
import { db } from "../db/index.js"
import { vaults, compositions, stocks, stockPrices } from "../db/schema.js"
import { and, eq, gte } from "drizzle-orm"

const app = new Hono()

app.get("/", async (c) => {
  const allVaults = await db.select().from(vaults)

  const result = await Promise.all(
    allVaults.map(async (vault) => {
      const comp = await db
        .select({
          weightBps: compositions.weightBps,
          stock: stocks,
        })
        .from(compositions)
        .innerJoin(stocks, eq(compositions.stockId, stocks.id))
        .where(eq(compositions.vaultId, vault.id))

      return { ...vault, compositions: comp }
    }),
  )

  return c.json(result)
})

app.get("/:id", async (c) => {
  const [vault] = await db
    .select()
    .from(vaults)
    .where(eq(vaults.id, c.req.param("id")))
    .limit(1)

  if (!vault) return c.json({ error: "Vault not found" }, 404)

  const comp = await db
    .select({
      weightBps: compositions.weightBps,
      stock: stocks,
    })
    .from(compositions)
    .innerJoin(stocks, eq(compositions.stockId, stocks.id))
    .where(eq(compositions.vaultId, vault.id))

  return c.json({ ...vault, compositions: comp })
})

// GET /api/vaults/:id/nav?days=N — weighted NAV time series
app.get("/:id/nav", async (c) => {
  const id = c.req.param("id")
  const daysParam = Number(c.req.query("days") ?? 365)
  const days = Math.min(Math.max(Number.isFinite(daysParam) ? daysParam : 365, 1), 730)
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  // Per-date close prices for every composition in this vault
  const rows = await db
    .select({
      date: stockPrices.date,
      weightBps: compositions.weightBps,
      close: stockPrices.close,
    })
    .from(compositions)
    .innerJoin(stockPrices, eq(stockPrices.stockId, compositions.stockId))
    .where(and(eq(compositions.vaultId, id), gte(stockPrices.date, cutoff)))

  // Count compositions to filter for dates with full coverage
  const compRows = await db
    .select({ stockId: compositions.stockId })
    .from(compositions)
    .where(eq(compositions.vaultId, id))
  const expectedTokens = compRows.length
  if (expectedTokens === 0) return c.json([])

  // Group + filter + weighted sum
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
