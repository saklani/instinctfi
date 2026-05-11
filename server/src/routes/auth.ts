import { Hono } from "hono"
import { z } from "zod"
import { db } from "../db/index.js"
import { wallets } from "../db/schema.js"
import { authMiddleware } from "../middleware/auth.js"
import type { AuthEnv } from "../lib/types.js"

const app = new Hono<AuthEnv>()

app.use("*", authMiddleware)

const authSchema = z.object({
  address: z.string().min(1),
})

// POST /api/auth — verifies the caller is signed in and records their connected wallet.
app.post("/", async (c) => {
  const userId = c.get("userId")
  const parsed = authSchema.safeParse(await c.req.json())

  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400)
  }

  const { address } = parsed.data

  await db
    .insert(wallets)
    .values({ userId, address })
    .onConflictDoUpdate({
      target: wallets.userId,
      set: { address, updatedAt: new Date() },
    })

  return c.json({ userId, address })
})

export default app
