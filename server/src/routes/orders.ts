import { Hono } from "hono"
import { Connection } from "@solana/web3.js"
import { z } from "zod"
import { db } from "../db"
import { orders, wallets } from "../db/schema"
import { eq, desc } from "drizzle-orm"
import { authMiddleware } from "../middleware/auth"
import { inngest } from "../inngest/client"
import { verifyUsdcTransfer } from "../lib/verify-transfer"

type AuthEnv = { Variables: { userId: string } }

const app = new Hono<AuthEnv>()
const connection = new Connection(process.env.RPC_URL!, "confirmed")

app.use("*", authMiddleware)

const createOrderSchema = z.object({
  vaultId: z.uuid(),
  type: z.enum(["deposit", "withdraw"]),
  amount: z.string().regex(/^\d+$/, "Amount must be an integer string"),
  signature: z.string().min(1),
})

app.post("/", async (c) => {
  const userId = c.get("userId")
  const body = await c.req.json()

  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400)
  }

  const { vaultId, type, amount, signature } = parsed.data

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
    .values({ userId, vaultId, type, amount, signature, status: "funded" })
    .returning()

  await inngest.send({
    name: "order/funded",
    data: { orderId: order.id },
  })

  return c.json(order, 201)
})

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
