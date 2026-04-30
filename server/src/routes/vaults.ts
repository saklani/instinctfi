import { Hono } from "hono"
import { db } from "../db"
import { vaults } from "../db/schema"
import { eq } from "drizzle-orm"

const app = new Hono()

// GET /api/vaults — list all vaults
app.get("/", async (c) => {
  const allVaults = await db.select().from(vaults)
  return c.json(allVaults)
})

// GET /api/vaults/:id — get a single vault
app.get("/:id", async (c) => {
  const id = c.req.param("id")
  const [vault] = await db.select().from(vaults).where(eq(vaults.id, id)).limit(1)

  if (!vault) return c.json({ error: "Vault not found" }, 404)
  return c.json(vault)
})

export default app
