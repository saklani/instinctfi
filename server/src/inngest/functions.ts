import { inngest } from "./client"
import { db } from "../db"
import { orders, positions, userWallets } from "../db/schema"
import { eq, and } from "drizzle-orm"
import { executeDeposit, executeWithdraw } from "../lib/symmetry"

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

function secondsUntilMarketOpen(): number {
  const now = new Date()
  const est = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  )
  const day = est.getDay()
  const hours = est.getHours()
  const minutes = est.getMinutes()
  const timeInMinutes = hours * 60 + minutes

  if (day >= 1 && day <= 5 && timeInMinutes < 570) {
    return (570 - timeInMinutes) * 60
  }

  let daysUntilOpen = 0
  if (day === 5 && timeInMinutes >= 1050) daysUntilOpen = 3
  else if (day === 6) daysUntilOpen = 2
  else if (day === 0) daysUntilOpen = 1
  else daysUntilOpen = 1

  const nextOpen = new Date(est)
  nextOpen.setDate(nextOpen.getDate() + daysUntilOpen)
  nextOpen.setHours(9, 30, 0, 0)

  return Math.max(60, Math.floor((nextOpen.getTime() - est.getTime()) / 1000))
}

export const processOrder = inngest.createFunction(
  {
    id: "process-order",
    retries: 2,
    triggers: [{ event: "order/funded" }],
  },
  async ({ event, step }) => {
    const orderId = event.data.orderId as string

    // Wait for market open
    if (!isMarketOpen()) {
      const waitSeconds = secondsUntilMarketOpen()
      await step.sleep("wait-for-market-open", `${waitSeconds}s`)
    }

    // Fetch order
    const [order] = await step.run("fetch-order", async () => {
      return db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    })

    if (!order || order.status !== "funded") {
      return { skipped: true, reason: "Order not found or not funded" }
    }

    // Fetch user wallet
    const [wallet] = await step.run("fetch-wallet", async () => {
      return db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, order.userId))
        .limit(1)
    })

    if (!wallet) {
      return { skipped: true, reason: "No server wallet found" }
    }

    // Process
    return await step.run("execute", async () => {
      try {
        await db
          .update(orders)
          .set({ status: "processing", updatedAt: new Date() })
          .where(eq(orders.id, order.id))

        if (order.type === "deposit") {
          const usdcLamports = Math.floor(Number(order.amountUsdc) * 1_000_000)

          const result = await executeDeposit({
            walletId: wallet.walletId,
            walletAddress: wallet.address,
            amountLamports: usdcLamports,
          })

          await db
            .update(orders)
            .set({
              status: "completed",
              txSignature: result.buySignatures[0],
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
                costBasisUsdc: String(
                  Number(existing.costBasisUsdc) + Number(order.amountUsdc),
                ),
                updatedAt: new Date(),
              })
              .where(eq(positions.id, existing.id))
          } else {
            await db.insert(positions).values({
              userId: order.userId,
              vaultId: order.vaultId,
              costBasisUsdc: order.amountUsdc,
            })
          }

          return { orderId: order.id, status: "completed", ...result }
        } else {
          // Withdraw
          const shareAmount = Math.floor(Number(order.amountUsdc) * 1_000_000) // TODO: convert USDC to shares

          const result = await executeWithdraw({
            walletId: wallet.walletId,
            walletAddress: wallet.address,
            amount: shareAmount,
          })

          await db
            .update(orders)
            .set({
              status: "completed",
              txSignature: result.signatures[0],
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
            errorMessage: e.message ?? "Unknown error",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id))

        throw e
      }
    })
  },
)
