import { Hono } from "hono"
import { z } from "zod"
import { and, eq, desc } from "drizzle-orm"
import { db } from "../db/index.js"
import { compositions, orders, vaults, wallets } from "../db/schema.js"
import { authMiddleware } from "../middleware/auth.js"
import { inngest } from "../inngest/client.js"
import type { AuthEnv } from "../lib/types.js"

// Jupiter won't route swaps below ~$5/leg. The binding constraint per vault
// is its lowest-weighted leg — that's the one most likely to fall below the
// floor for a given deposit.
const MIN_LEG_USDC_ATOMIC = 5_000_000n // $5 in USDC atomic units

const app = new Hono<AuthEnv>()

app.use("*", authMiddleware)

// ── Deposit ─────────────────────────────────────────────

const depositSchema = z.object({
  vaultId: z.uuid(),
  signature: z.string().min(1),
  amountUsdc: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "amountUsdc must be a decimal string"),
})

// PWA builds + signs the USDC transfer client-side (Connected → Instinct),
// then posts the signature + intended amount here. We just record the order
// and fire the Inngest event. The worker handles on-chain verification with
// durable retries (no RPC roundtrip in this handler).
app.post("/deposit", async (c) => {
  const userId = c.get("userId")
  const parsed = depositSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400)
  }
  const { vaultId, signature, amountUsdc } = parsed.data

  const amountAtomic = BigInt(Math.floor(parseFloat(amountUsdc) * 1e6))
  if (amountAtomic <= 0n) {
    return c.json({ error: "amountUsdc must be greater than zero" }, 400)
  }

  const [vault] = await db
    .select({ id: vaults.id })
    .from(vaults)
    .where(eq(vaults.id, vaultId))
    .limit(1)
  if (!vault) return c.json({ error: "Vault not found" }, 404)

  const comp = await db
    .select({ weight: compositions.weight })
    .from(compositions)
    .where(eq(compositions.vaultId, vaultId))
  if (comp.length === 0) {
    return c.json({ error: "Vault has no composition" }, 400)
  }
  const minWeight = comp.reduce((m, c) => Math.min(m, c.weight), Infinity)
  // amount × min_weight / 10000 ≥ MIN_LEG_USDC_ATOMIC
  // → amount ≥ MIN_LEG_USDC_ATOMIC × 10000 / min_weight
  const minDepositAtomic =
    (MIN_LEG_USDC_ATOMIC * 10_000n) / BigInt(minWeight)
  if (amountAtomic < minDepositAtomic) {
    const minUsd = Number(minDepositAtomic) / 1e6
    return c.json(
      { error: `Minimum deposit for this vault is $${minUsd.toFixed(2)}` },
      400,
    )
  }

  const [userWallet] = await db
    .select({ privyWalletId: wallets.privyWalletId })
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1)
  if (!userWallet?.privyWalletId) {
    return c.json(
      { error: "Wallet not provisioned. Call POST /api/auth first." },
      400,
    )
  }

  try {
    const [order] = await db
      .insert(orders)
      .values({
        userId,
        vaultId,
        type: "deposit",
        amount: amountAtomic.toString(),
        signature,
        status: "pending",
      })
      .returning()

    await inngest.send({
      name: "deposit/execute",
      data: { orderId: order.id },
    })

    return c.json(order, 202)
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err.code === "23505" || err.message?.includes("unique")) {
      return c.json({ error: "This transfer has already been used for a deposit" }, 409)
    }
    throw e
  }
})

// ── Withdraw ────────────────────────────────────────────

const withdrawSchema = z.object({
  vaultId: z.uuid(),
  amountUsdc: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "amountUsdc must be a decimal string")
    .optional(),
})

// Withdraw — full exit if amountUsdc omitted, partial proportional sell if
// specified. The Inngest pipeline computes per-leg sells; this endpoint just
// records intent and validates the min floor.
app.post("/withdraw", async (c) => {
  const userId = c.get("userId")
  const parsed = withdrawSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400)
  }
  const { vaultId, amountUsdc } = parsed.data

  let amountAtomic = 0n // 0 = full exit, picked up by verifyWithdraw
  if (amountUsdc) {
    amountAtomic = BigInt(Math.floor(parseFloat(amountUsdc) * 1e6))
    if (amountAtomic <= 0n) {
      return c.json({ error: "amountUsdc must be greater than zero" }, 400)
    }
    // Min floor — same math as deposits, dictated by smallest weight.
    const comp = await db
      .select({ weight: compositions.weight })
      .from(compositions)
      .where(eq(compositions.vaultId, vaultId))
    if (comp.length > 0) {
      const minWeight = comp.reduce((m, c) => Math.min(m, c.weight), Infinity)
      const minWithdrawAtomic =
        (MIN_LEG_USDC_ATOMIC * 10_000n) / BigInt(minWeight)
      if (amountAtomic < minWithdrawAtomic) {
        const minUsd = Number(minWithdrawAtomic) / 1e6
        return c.json(
          { error: `Minimum withdraw for this vault is $${minUsd.toFixed(2)}` },
          400,
        )
      }
    }
  }

  const [vault] = await db
    .select({ id: vaults.id })
    .from(vaults)
    .where(eq(vaults.id, vaultId))
    .limit(1)
  if (!vault) return c.json({ error: "Vault not found" }, 404)

  const [userWallet] = await db
    .select({ privyWalletId: wallets.privyWalletId })
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1)
  if (!userWallet?.privyWalletId) {
    return c.json({ error: "Wallet not provisioned" }, 400)
  }

  // Refuse if there's already an in-flight withdraw for this user+vault.
  const [activeWithdraw] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.vaultId, vaultId),
        eq(orders.type, "withdraw"),
      ),
    )
    .orderBy(desc(orders.createdAt))
    .limit(1)
  if (
    activeWithdraw &&
    (activeWithdraw.status === "pending" ||
      activeWithdraw.status === "processing" ||
      activeWithdraw.status === "executing")
  ) {
    return c.json(
      { error: "A withdrawal is already in flight for this vault" },
      409,
    )
  }

  const [order] = await db
    .insert(orders)
    .values({
      userId,
      vaultId,
      type: "withdraw",
      // 0 → full exit (settleWithdraw overwrites with realized USDC out)
      // > 0 → partial target (verifyWithdraw uses to compute per-leg fractions)
      amount: amountAtomic.toString(),
      status: "pending",
    })
    .returning()

  await inngest.send({
    name: "withdraw/execute",
    data: { orderId: order.id },
  })

  return c.json(order, 202)
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

// ── Single ──────────────────────────────────────────────

app.get("/:id", async (c) => {
  const userId = c.get("userId")
  const id = c.req.param("id")
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    .limit(1)
  if (!order) return c.json({ error: "Order not found" }, 404)
  return c.json(order)
})

// ── Cancel ──────────────────────────────────────────────
//
// Pending-only. Atomic state transition pending → cancelled prevents racing
// the Inngest worker. If the worker has already started (status ≠ pending),
// the cancel is rejected. Refund of the user's USDC is fired immediately
// since by definition no swap has run yet — full amount is in Instinct.

app.post("/:id/cancel", async (c) => {
  const userId = c.get("userId")
  const id = c.req.param("id")

  const [claimed] = await db
    .update(orders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(orders.id, id), eq(orders.userId, userId), eq(orders.status, "pending")))
    .returning()

  if (!claimed) {
    // Either order doesn't belong to user, doesn't exist, or already moved out
    // of pending. Surface the current order so the UI can update.
    const [current] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, userId)))
      .limit(1)
    if (!current) return c.json({ error: "Order not found" }, 404)
    return c.json(
      { error: `Cannot cancel: order is ${current.status}` },
      409,
    )
  }

  // Fire the refund event — refundDeposit Inngest function handles the
  // server-signed transfer with retries. The order is already cancelled in
  // DB; refund is async and gets a signature on completion.
  await inngest.send({
    name: "deposit/refund",
    data: { orderId: id, amountAtomic: claimed.amount },
  })

  return c.json(claimed)
})

export default app
