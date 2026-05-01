import { Hono } from "hono"
import { Connection } from "@solana/web3.js"
import { z } from "zod"
import { db } from "../db/index.js"
import { orders } from "../db/schema.js"
import { eq, desc } from "drizzle-orm"
import { authMiddleware } from "../middleware/auth.js"
import { verifyUsdcTransfer } from "../lib/verify-transfer.js"
import { getTreasuryWallet } from "../lib/privy.js"

type AuthEnv = { Variables: { userId: string } }

const app = new Hono<AuthEnv>()
const connection = new Connection(process.env.RPC_URL!, "confirmed")

app.use("*", authMiddleware)

// ── Deposit ─────────────────────────────────────────────

const depositSchema = z.object({
  vaultId: z.string().uuid(),
  signature: z.string().min(1),
  address: z.string().min(1),
})

app.post("/deposit", async (c) => {
  const userId = c.get("userId")
  const parsed = depositSchema.safeParse(await c.req.json())

  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400)
  }

  const { vaultId, signature, address } = parsed.data
  const treasury = getTreasuryWallet()

  const result = await verifyUsdcTransfer(
    connection,
    signature,
    treasury.address,
    address,
  )

  if (!result.valid || !result.details) {
    return c.json({ error: result.error ?? "Transfer verification failed" }, 400)
  }

  if (result.details.amount <= 0n) {
    return c.json({ error: "Deposit amount must be greater than zero." }, 400)
  }

  try {
    const [order] = await db
      .insert(orders)
      .values({
        userId,
        vaultId,
        type: "deposit",
        amount: result.details.amount.toString(),
        signature,
        status: "funded",
      })
      .returning()

    return c.json(order, 201)
  } catch (e: any) {
    if (e.message?.includes("unique") || e.code === "23505") {
      return c.json({ error: "This transaction has already been used." }, 409)
    }
    throw e
  }
})

// ── List ────────────────────────────────────────────────

app.get("/", async (c) => {
  const userId = c.get("userId")

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))

  return c.json(userOrders)
})

export default app
