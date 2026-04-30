import { Hono } from "hono"
import { Connection } from "@solana/web3.js"
import { db } from "../db"
import { orders, wallets } from "../db/schema"
import { eq, desc } from "drizzle-orm"
import { authMiddleware } from "../middleware/auth"
import { inngest } from "../inngest/client"

type AuthEnv = { Variables: { userId: string } }

const app = new Hono<AuthEnv>()
const connection = new Connection(process.env.RPC_URL!, "confirmed")

app.use("*", authMiddleware)

// POST /api/orders — verify transfer tx, create order as funded, trigger processing
app.post("/", async (c) => {
  const userId = c.get("userId")
  const { vaultId, type, amount, signature } = await c.req.json()

  if (!vaultId || !type || !amount || !signature) {
    return c.json({ error: "Missing required fields: vaultId, type, amount, signature" }, 400)
  }

  if (type !== "deposit" && type !== "withdraw") {
    return c.json({ error: "Type must be 'deposit' or 'withdraw'" }, 400)
  }

  // Get user's server wallet
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1)

  if (!wallet) {
    return c.json({ error: "No wallet found. Call POST /api/auth first." }, 400)
  }

  // Verify the transaction on-chain
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  })

  if (!tx) {
    return c.json({ error: "Transaction not found" }, 400)
  }

  if (tx.meta?.err) {
    return c.json({ error: "Transaction failed on-chain" }, 400)
  }

  // TODO: verify the tx actually transfers the correct USDC amount to wallet.address

  // Create order as funded
  const [order] = await db
    .insert(orders)
    .values({
      userId,
      vaultId,
      type,
      amount: String(amount),
      signature,
      status: "funded",
    })
    .returning()

  // Trigger processing
  await inngest.send({
    name: "order/funded",
    data: { orderId: order.id },
  })

  return c.json(order, 201)
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

export default app
