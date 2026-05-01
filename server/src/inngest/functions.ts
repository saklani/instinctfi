import { inngest } from "./client.js"
import { db } from "../db/index.js"
import { orders, positions, vaults } from "../db/schema.js"
import { eq, and, asc } from "drizzle-orm"
import { executeDeposit, executeWithdraw, hasActiveIntent } from "../lib/symmetry.js"
import { getTreasuryWallet } from "../lib/privy.js"

function isMarketOpen(): boolean {
  const now = new Date()
  const est = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  )
  const day = est.getDay()
  const hours = est.getHours()
  const minutes = est.getMinutes()
  const timeInMinutes = hours * 60 + minutes

  const isWeekday = day >= 1 && day <= 5
  const isMarketHours = timeInMinutes >= 570 && timeInMinutes <= 1050

  return isWeekday && isMarketHours
}

export const processOrderQueue = inngest.createFunction(
  
  {
    id: "process-order-queue",
    retries: 0,
    triggers: { cron: "* * * * *" } 
  }, // every minute
  async ({ step }) => {
    // Skip if market is closed
    if (!isMarketOpen()) {
      return { skipped: true, reason: "Market closed" }
    }

    // Get the oldest funded order
    const [order] = await step.run("fetch-next-order", async () => {
      return db
        .select()
        .from(orders)
        .where(eq(orders.status, "funded"))
        .orderBy(asc(orders.createdAt))
        .limit(1)
    })

    if (!order) {
      return { skipped: true, reason: "No funded orders" }
    }

    // Get vault info
    const [vault] = await step.run("fetch-vault", async () => {
      return db.select().from(vaults).where(eq(vaults.id, order.vaultId)).limit(1)
    })

    if (!vault) {
      return { skipped: true, reason: "Vault not found" }
    }

    // Check if vault has an active intent — if so, wait
    const intentActive = await step.run("check-intent", async () => {
      return hasActiveIntent(vault.vaultAddress)
    })

    if (intentActive) {
      return { skipped: true, reason: "Active intent exists, will retry next cycle" }
    }

    // Process the order
    const treasury = getTreasuryWallet()

    return await step.run("execute", async () => {
      try {
        await db
          .update(orders)
          .set({ status: "processing", updatedAt: new Date() })
          .where(eq(orders.id, order.id))

        if (order.type === "deposit") {
          const result = await executeDeposit({
            walletId: treasury.walletId,
            walletAddress: treasury.address,
            vaultMint: vault.vaultMint,
            amountLamports: Number(order.amount),
          })

          await db
            .update(orders)
            .set({
              status: "completed",
              signature: result.buySignatures[0],
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id))

          // Upsert position
          const [existing] = await db
            .select()
            .from(positions)
            .where(
              and(
                eq(positions.userId, order.userId),
                eq(positions.vaultId, order.vaultId),
              ),
            )
            .limit(1)

          if (existing) {
            await db
              .update(positions)
              .set({
                amount: String(Number(existing.amount) + Number(order.amount)),
                updatedAt: new Date(),
              })
              .where(eq(positions.id, existing.id))
          } else {
            await db.insert(positions).values({
              userId: order.userId,
              vaultId: order.vaultId,
              amount: order.amount,
            })
          }

          return { orderId: order.id, status: "completed", ...result }
        } else {
          const result = await executeWithdraw({
            walletId: treasury.walletId,
            walletAddress: treasury.address,
            vaultMint: vault.vaultMint,
            amount: Number(order.amount),
          })

          await db
            .update(orders)
            .set({
              status: "completed",
              signature: result.signatures[0],
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id))

          return { orderId: order.id, status: "completed", ...result }
        }
      } catch (e: any) {
        await db
          .update(orders)
          .set({
            status: "failed",
            error: e.message ?? "Unknown error",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id))

        throw e
      }
    })
  },
)
