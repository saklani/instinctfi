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

// POST /api/auth — idempotent. On first sight of a user, provisions an Instinct
// wallet (Privy server wallet we own) and records both the user's connected
// signing wallet and the Instinct wallet in the wallets row. Returns the
// Instinct address so the PWA can build USDC transfers into it.
app.post("/", async (c) => {
  const userId = c.get("userId")
  const parsed = authSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400)
  }
  const { connectedAddress, connectedClientType } = parsed.data

  const [existing] = await db
    .select({
      privyWalletId: wallets.privyWalletId,
      address: wallets.address,
    })
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1)

  // Fully provisioned: just touch connected info and return.
  if (existing?.privyWalletId) {
    await db
      .update(wallets)
      .set({
        connectedAddress,
        connectedClientType,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId))

    return c.json({
      userId,
      instinctAddress: existing.address,
      connectedAddress,
    })
  }

  // Either no row, or a legacy row without an Instinct wallet → provision now.
  const instinct = await privy.wallets().create({ chain_type: "solana" })

  if (existing) {
    await db
      .update(wallets)
      .set({
        privyWalletId: instinct.id,
        address: instinct.address,
        connectedAddress,
        connectedClientType,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId))
  } else {
    await db.insert(wallets).values({
      userId,
      privyWalletId: instinct.id,
      address: instinct.address,
      connectedAddress,
      connectedClientType,
    })
  }

  return c.json({
    userId,
    instinctAddress: instinct.address,
    connectedAddress,
  })
})

export default app
