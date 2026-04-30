import { Hono } from "hono"
import { db } from "../db"
import { positions } from "../db/schema"
import { eq, and } from "drizzle-orm"
import { authMiddleware } from "../middleware/auth"

type AuthEnv = { Variables: { userId: string } }

const app = new Hono<AuthEnv>()

app.use("*", authMiddleware)

app.get("/", async (c) => {
  const userId = c.get("userId")

  const userPositions = await db
    .select()
    .from(positions)
    .where(eq(positions.userId, userId))

  return c.json(userPositions)
})

app.get("/:vaultId", async (c) => {
  const userId = c.get("userId")
  const vaultId = c.req.param("vaultId")

  const [position] = await db
    .select()
    .from(positions)
    .where(and(eq(positions.userId, userId), eq(positions.vaultId, vaultId)))
    .limit(1)

  if (!position) return c.json({ error: "Position not found" }, 404)
  return c.json(position)
})

export default app
