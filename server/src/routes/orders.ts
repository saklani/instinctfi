import { Hono } from "hono"
import { db } from "../db"
import { orders } from "../db/schema"
import { eq, desc } from "drizzle-orm"
import { authMiddleware } from "../middleware/auth"
import { getOrCreateUserWallet } from "../lib/privy"
import { inngest } from "../inngest/client"

type AuthEnv = { Variables: { userId: string } }

const app = new Hono<AuthEnv>()

app.use("*", authMiddleware)

// POST /api/orders — create order, returns deposit address
app.post("/", async (c) => {
  const userId = c.get("userId")
  const body = await c.req.json()
  const { vaultId, type, amount } = body

  if (!vaultId || !type || !amount) {
    return c.json({ error: "Missing required fields: vaultId, type, amount" }, 400)
  }

  if (type !== "deposit" && type !== "withdraw") {
    return c.json({ error: "Type must be 'deposit' or 'withdraw'" }, 400)
  }

  const { address: depositAddress } = await getOrCreateUserWallet(userId)

  const [order] = await db
    .insert(orders)
    .values({
      userId,
      vaultId,
      type,
      amount: String(amount),
      status: "pending",
    })
    .returning()

  return c.json({ ...order, depositAddress }, 201)
})

// GET /api/orders — list user's orders
app.get("/", async (c) => {
  const userId = c.get("userId")

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))

  return c.json(userOrders)
})

// POST /api/orders/:id/confirm — user confirms USDC sent
app.post("/:id/confirm", async (c) => {
  const userId = c.get("userId")
  const orderId = c.req.param("id")

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order || order.userId !== userId) {
    return c.json({ error: "Order not found" }, 404)
  }

  if (order.status !== "pending") {
    return c.json({ error: "Order is not pending" }, 400)
  }

  await db
    .update(orders)
    .set({ status: "funded", updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  await inngest.send({
    name: "order/funded",
    data: { orderId },
  })

  return c.json({ status: "funded" })
})

export default app
