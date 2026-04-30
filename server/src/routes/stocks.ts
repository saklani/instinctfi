import { Hono } from "hono"
import { db } from "../db"
import { stocks } from "../db/schema"
import { eq } from "drizzle-orm"

const app = new Hono()

// GET /api/stocks — list all stocks
app.get("/", async (c) => {
  const allStocks = await db.select().from(stocks)
  return c.json(allStocks)
})

// GET /api/stocks/:id — get a single stock
app.get("/:id", async (c) => {
  const id = c.req.param("id")
  const [stock] = await db.select().from(stocks).where(eq(stocks.id, id)).limit(1)

  if (!stock) return c.json({ error: "Stock not found" }, 404)
  return c.json(stock)
})

export default app
