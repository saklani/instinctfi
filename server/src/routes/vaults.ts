import { Hono } from "hono"
import { db } from "../db"
import { vaults } from "../db/schema"
import { eq } from "drizzle-orm"

const app = new Hono()

app.get("/", async (c) => {
  const data = await db.select().from(vaults)
  return c.json(data)
})

app.get("/:id", async (c) => {
  const [vault] = await db
    .select()
    .from(vaults)
    .where(eq(vaults.id, c.req.param("id")))
    .limit(1)

  if (!vault) return c.json({ error: "Vault not found" }, 404)
  return c.json(vault)
})

export default app
