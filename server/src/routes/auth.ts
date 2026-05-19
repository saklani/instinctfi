import { Hono } from "hono"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "../db/index.js"
import { wallets } from "../db/schema.js"
import { authMiddleware } from "../middleware/auth.js"
import { privy } from "../lib/privy.js"
import type { AuthEnv } from "../lib/types.js"

const app = new Hono<AuthEnv>()

app.use("*", authMiddleware)

const authSchema = z.object({
  connectedAddress: z.string().min(1),
  connectedClientType: z.enum(["privy", "external"]),
})

// POST /api/auth — insert-if-missing. On first sight of a user, provisions an
// Instinct wallet (Privy server wallet we own) and inserts the wallets row.
// If the row already exists, no writes — just returns the stored values.
app.post("/", async (c) => {
  const userId = c.get("userId")
  const parsed = authSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400)
  }
  const { connectedAddress, connectedClientType } = parsed.data

  const [existing] = await db
    .select({
      address: wallets.address,
      connectedAddress: wallets.connectedAddress,
    })
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1)

  if (existing) {
    return c.json({
      userId,
      instinctAddress: existing.address,
      connectedAddress: existing.connectedAddress ?? connectedAddress,
    })
  }

  const instinct = await privy.wallets().create({ chain_type: "solana" })

  await db.insert(wallets).values({
    userId,
    privyWalletId: instinct.id,
    address: instinct.address,
    connectedAddress,
    connectedClientType,
  })

  return c.json({
    userId,
    instinctAddress: instinct.address,
    connectedAddress,
  })
})

export default app
