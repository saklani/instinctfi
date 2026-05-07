import { Hono } from "hono"
import { db } from "../db/index.js"
import { stocks, stockPrices } from "../db/schema.js"
import { and, asc, eq, gte } from "drizzle-orm"

const app = new Hono()

// GET /api/stocks — list all stocks
app.get("/", async (c) => {
  const allStocks = await db.select().from(stocks)
  return c.json(allStocks)
})

// GET /api/stocks/by-ticker/:ticker — lookup by ticker
app.get("/by-ticker/:ticker", async (c) => {
  const ticker = c.req.param("ticker")
  const [stock] = await db
    .select()
    .from(stocks)
    .where(eq(stocks.ticker, ticker))
    .limit(1)

  if (!stock) return c.json({ error: "Stock not found" }, 404)
  return c.json(stock)
})

// GET /api/stocks/:id — get a single stock by id
app.get("/:id", async (c) => {
  const id = c.req.param("id")
  const [stock] = await db.select().from(stocks).where(eq(stocks.id, id)).limit(1)

  if (!stock) return c.json({ error: "Stock not found" }, 404)
  return c.json(stock)
})

// GET /api/stocks/:id/prices?days=N — historical OHLCV
app.get("/:id/prices", async (c) => {
  const id = c.req.param("id")
  const daysParam = Number(c.req.query("days") ?? 365)
  const days = Math.min(Math.max(Number.isFinite(daysParam) ? daysParam : 365, 1), 730)

  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  const rows = await db
    .select({
      date: stockPrices.date,
      open: stockPrices.open,
      high: stockPrices.high,
      low: stockPrices.low,
      close: stockPrices.close,
    })
    .from(stockPrices)
    .where(and(eq(stockPrices.stockId, id), gte(stockPrices.date, cutoff)))
    .orderBy(asc(stockPrices.date))

  return c.json(rows)
})

export default app
