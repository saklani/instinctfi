import { Hono } from "hono"
import { Connection } from "@solana/web3.js"
import { z } from "zod"
import { db } from "../db/index.js"
import { orders, wallets, positions } from "../db/schema.js"
import { eq, and, desc } from "drizzle-orm"
import { authMiddleware } from "../middleware/auth.js"
import { inngest } from "../inngest/client.js"
import { verifyUsdcTransfer } from "../lib/verify-transfer.js"

type AuthEnv = { Variables: { userId: string } }

const app = new Hono<AuthEnv>()
const connection = new Connection(process.env.RPC_URL!, "confirmed")

app.use("*", authMiddleware)

// ── Deposit ─────────────────────────────────────────────

const depositSchema = z.object({
  vaultId: z.string().uuid(),
  amount: z.string().regex(/^\d+$/, "Amount must be an integer string"),
  signature: z.string().min(1),
})

app.post("/deposit", async (c) => {
  const userId = c.get("userId")
  const parsed = depositSchema.safeParse(await c.req.json())

  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400)
  }

  const { vaultId, amount, signature } = parsed.data

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1)

  if (!wallet) {
    return c.json({ error: "No wallet found. Call POST /api/auth first." }, 400)
  }

  const { valid, error } = await verifyUsdcTransfer(
    connection,
    signature,
    wallet.address,
    BigInt(amount),
  )

  if (!valid) {
    return c.json({ error: error ?? "Transfer verification failed" }, 400)
  }

  const [order] = await db
    .insert(orders)
    .values({ userId, vaultId, type: "deposit", amount, signature, status: "funded" })
    .returning()

  await inngest.send({ name: "order/funded", data: { orderId: order.id } })

  return c.json(order, 201)
})

// ── Withdraw ────────────────────────────────────────────

const withdrawSchema = z.object({
  vaultId: z.string().uuid(),
  amount: z.string().regex(/^\d+$/, "Amount must be an integer string"),
})

app.post("/withdraw", async (c) => {
  const userId = c.get("userId")
  const parsed = withdrawSchema.safeParse(await c.req.json())

  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400)
  }

  const { vaultId, amount } = parsed.data

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1)

  if (!wallet) {
    return c.json({ error: "No wallet found. Call POST /api/auth first." }, 400)
  }

  // Verify user has enough shares
  const [position] = await db
    .select()
    .from(positions)
    .where(and(eq(positions.userId, userId), eq(positions.vaultId, vaultId)))
    .limit(1)

  if (!position || BigInt(position.shares ?? "0") < BigInt(amount)) {
    return c.json({ error: "Insufficient shares" }, 400)
  }

  const [order] = await db
    .insert(orders)
    .values({ userId, vaultId, type: "withdraw", amount, status: "funded" })
    .returning()

  await inngest.send({ name: "order/funded", data: { orderId: order.id } })

  return c.json(order, 201)
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
