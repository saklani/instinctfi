import { Hono } from "hono"
import { db } from "../db/index.js"
import { vaults, compositions, stocks } from "../db/schema.js"
import { eq } from "drizzle-orm"

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

export default app
