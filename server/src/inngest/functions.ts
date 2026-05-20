import { Connection } from "@solana/web3.js"
import { asc, eq, sql } from "drizzle-orm"

import { and, inArray } from "drizzle-orm"

import { db } from "../db/index.js"
import {
  compositions,
  holdings,
  orders,
  stockPrices,
  stocks,
  vaultNav,
  vaults,
  wallets,
} from "../db/schema.js"
import {
  quoteSwap,
  executeQuoted,
  transferUsdc,
  ensureInstinctSolBalance,
  type Quote,
  type ExecuteResult,
} from "../lib/router.js"
import { verifyUsdcTransfer } from "../lib/verify-transfer.js"
import { fetchTokenInfo } from "../lib/jupiter-prices.js"
import { isUsMarketOpen, nextUsMarketOpen } from "../lib/market-hours.js"
import { PYTH_BENCHMARKS_URL, PYTH_SYMBOLS } from "../lib/pyth-symbols.js"
import { inngest } from "./client.js"
import type { SwapLegResult } from "../db/schema.js"

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const MAX_VERIFY_RETRIES = 20 // 20 × 5s = ~100s wait for RPC confirmation

const connection = new Connection(process.env.RPC_URL!, "confirmed")

// ─── Stage 1: verify-order ──────────────────────────────────────────────────
//
// Confirms the user's USDC transfer landed on-chain (and matches expected
// amount/destination/authority). Status transitions pending → processing.
// On success emits deposit/quote.

export const verifyOrder = inngest.createFunction(
  {
    id: "verify-order",
    concurrency: { limit: 5 },
    triggers: [{ event: "deposit/execute" }],
  },
  async ({ event, step }) => {
    const { orderId } = event.data as { orderId: string }

    const [order] = await step.run("load-order", () =>
      db.select().from(orders).where(eq(orders.id, orderId)).limit(1),
    )
    if (!order) throw new Error(`Order ${orderId} not found`)
    if (order.type !== "deposit") throw new Error(`Order ${orderId} is not a deposit`)
    if (order.status !== "pending") {
      return { orderId, skipped: order.status }
    }
    if (!order.signature) {
      await step.run("fail-no-signature", () =>
        db
          .update(orders)
          .set({ status: "failed", error: "Missing on-chain signature", updatedAt: new Date() })
          .where(eq(orders.id, orderId)),
      )
      return { orderId, status: "failed", stage: "verify-order" }
    }

    const [userWallet] = await step.run("load-wallet", () =>
      db
        .select({
          privyWalletId: wallets.privyWalletId,
          instinctAddress: wallets.address,
          connectedAddress: wallets.connectedAddress,
        })
        .from(wallets)
        .where(eq(wallets.userId, order.userId))
        .limit(1),
    )
    if (!userWallet?.privyWalletId || !userWallet.connectedAddress) {
      await step.run("fail-no-wallet", () =>
        db
          .update(orders)
          .set({ status: "failed", error: "Wallet not provisioned", updatedAt: new Date() })
          .where(eq(orders.id, orderId)),
      )
      return { orderId, status: "failed", stage: "verify-order" }
    }

    const verifyResult = await step.run("verify-transfer", async () => {
      await db
        .update(orders)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(orders.id, orderId))
      for (let i = 0; i < MAX_VERIFY_RETRIES; i++) {
        const r = await verifyUsdcTransfer(
          connection,
          order.signature!,
          userWallet.instinctAddress,
          userWallet.connectedAddress!,
          BigInt(order.amount),
        )
        if (r.ok) return r
        if (r.reason !== "not_found") return r
        if (i < MAX_VERIFY_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      }
      return {
        ok: false as const,
        reason: "not_found" as const,
        detail: "Transaction not found on-chain within retry window",
      }
    })

    if (!verifyResult.ok) {
      // No USDC arrived → no refund needed.
      await step.run("fail-verify", () =>
        db
          .update(orders)
          .set({
            status: "failed",
            error: `${verifyResult.reason}: ${verifyResult.detail}`,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId)),
      )
      return { orderId, status: "failed", stage: "verify-order" }
    }

    await step.sendEvent("emit-quote", {
      name: "deposit/quote",
      data: { orderId },
    })

    return { orderId, status: "processing", stage: "verify-order" }
  },
)

// ─── Stage 2: quote-order ───────────────────────────────────────────────────
//
// Quotes every leg via Jupiter in parallel. Quote-gate: if any leg returns
// no_route, fail the order and queue a full refund. On success, hands off
// the quote bundle to execute-quote.

export const quoteOrder = inngest.createFunction(
  {
    id: "quote-order",
    concurrency: { limit: 5 },
    triggers: [{ event: "deposit/quote" }],
  },
  async ({ event, step }) => {
    const { orderId } = event.data as { orderId: string }

    const [order] = await step.run("load-order", () =>
      db.select().from(orders).where(eq(orders.id, orderId)).limit(1),
    )
    if (!order) throw new Error(`Order ${orderId} not found`)
    if (order.status === "cancelled" || order.status === "failed") {
      return { orderId, skipped: order.status }
    }

    if (!isUsMarketOpen()) {
      await step.sleepUntil("wait-for-market-open", nextUsMarketOpen())
    }

    const [userWallet] = await step.run("load-wallet", () =>
      db
        .select({ instinctAddress: wallets.address })
        .from(wallets)
        .where(eq(wallets.userId, order.userId))
        .limit(1),
    )
    if (!userWallet) throw new Error("wallet missing")

    const composition = await step.run("load-composition", () =>
      db
        .select({ weight: compositions.weight, mint: stocks.address })
        .from(compositions)
        .innerJoin(stocks, eq(compositions.stockId, stocks.id))
        .where(eq(compositions.vaultId, order.vaultId)),
    )
    if (composition.length === 0) {
      await step.run("fail-no-composition", () =>
        db
          .update(orders)
          .set({ status: "failed", error: "Vault has no composition", updatedAt: new Date() })
          .where(eq(orders.id, orderId)),
      )
      await step.sendEvent("queue-refund", {
        name: "deposit/refund",
        data: { orderId, amountAtomic: order.amount },
      })
      return { orderId, status: "failed", stage: "quote-order" }
    }

    const totalAtomic = BigInt(order.amount)
    const legs = composition
      .map((c) => ({
        mint: c.mint,
        weight: c.weight,
        allocationStr: ((totalAtomic * BigInt(c.weight)) / 10_000n).toString(),
      }))
      .filter((l) => BigInt(l.allocationStr) > 0n)

    const solDrip = await step.run("ensure-sol", () =>
      ensureInstinctSolBalance(userWallet.instinctAddress),
    )
    if (!solDrip.ok) {
      await step.run("fail-no-sol", () =>
        db
          .update(orders)
          .set({
            status: "failed",
            error: `SOL drip failed: ${solDrip.detail}`,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId)),
      )
      await step.sendEvent("queue-refund", {
        name: "deposit/refund",
        data: { orderId, amountAtomic: order.amount },
      })
      return { orderId, status: "failed", stage: "quote-order" }
    }

    const quotes = await step.run("quote-all", () =>
      Promise.all(
        legs.map((leg) =>
          quoteSwap({
            walletAddress: userWallet.instinctAddress,
            inputMint: USDC_MINT,
            outputMint: leg.mint,
            amount: BigInt(leg.allocationStr),
          }),
        ),
      ),
    )

    const failedQuotes = quotes
      .map((q, i) => ({ leg: legs[i], q }))
      .filter((x) => !x.q.ok)

    if (failedQuotes.length > 0) {
      await step.run("fail-no-route", () =>
        db
          .update(orders)
          .set({
            status: "failed",
            error: failedQuotes
              .map(
                (x) =>
                  `${x.leg.mint}: ${(x.q as { reason: string; detail: string }).reason} (${(x.q as { reason: string; detail: string }).detail})`,
              )
              .join("; "),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId)),
      )
      await step.sendEvent("queue-refund", {
        name: "deposit/refund",
        data: { orderId, amountAtomic: order.amount },
      })
      return { orderId, status: "failed", stage: "quote-order" }
    }

    await step.sendEvent("emit-swap", {
      name: "deposit/swap",
      data: {
        orderId,
        legs: legs.map((l) => ({ mint: l.mint, weight: l.weight })),
        quotes: quotes as Quote[],
      },
    })

    return { orderId, status: "processing", stage: "quote-order", legs: legs.length }
  },
)

// ─── Stage 3: execute-quote ─────────────────────────────────────────────────
//
// Signs and submits every leg in parallel using the locked-in quotes. Status
// transitions processing → executing. Hands aggregated executions to
// verify-quote (no status update here on its own — that's stage 4's job).

export const executeQuote = inngest.createFunction(
  {
    id: "execute-quote",
    concurrency: { limit: 5 },
    triggers: [{ event: "deposit/swap" }],
  },
  async ({ event, step }) => {
    const { orderId, legs, quotes } = event.data as {
      orderId: string
      legs: { mint: string; weight: number }[]
      quotes: Quote[]
    }

    const [order] = await step.run("load-order", () =>
      db.select().from(orders).where(eq(orders.id, orderId)).limit(1),
    )
    if (!order) throw new Error(`Order ${orderId} not found`)
    if (order.status === "cancelled" || order.status === "failed") {
      return { orderId, skipped: order.status }
    }

    const [userWallet] = await step.run("load-wallet", () =>
      db
        .select({ privyWalletId: wallets.privyWalletId })
        .from(wallets)
        .where(eq(wallets.userId, order.userId))
        .limit(1),
    )
    if (!userWallet?.privyWalletId) throw new Error("wallet not provisioned")

    const executions: ExecuteResult[] = await step.run(
      "execute-all",
      async () => {
        await db
          .update(orders)
          .set({ status: "executing", updatedAt: new Date() })
          .where(eq(orders.id, orderId))
        return Promise.all(
          quotes.map((q) => executeQuoted(q, userWallet.privyWalletId!)),
        )
      },
    )

    await step.sendEvent("emit-aggregate", {
      name: "deposit/aggregate",
      data: { orderId, legs, executions },
    })

    return { orderId, status: "executing", stage: "execute-quote" }
  },
)

// ─── Stage 4: verify-quote ──────────────────────────────────────────────────
//
// Aggregates per-leg execution results into final order status (completed /
// partial / failed). If any USDC remains unspent in Instinct (partial or
// failed), queues the refund step.

export const verifyQuote = inngest.createFunction(
  {
    id: "verify-quote",
    concurrency: { limit: 5 },
    triggers: [{ event: "deposit/aggregate" }],
  },
  async ({ event, step }) => {
    const { orderId, legs, executions } = event.data as {
      orderId: string
      legs: { mint: string; weight: number }[]
      executions: ExecuteResult[]
    }

    const [order] = await step.run("load-order", () =>
      db.select().from(orders).where(eq(orders.id, orderId)).limit(1),
    )
    if (!order) throw new Error(`Order ${orderId} not found`)

    const results: SwapLegResult[] = legs.map((leg, i) => {
      const e = executions[i]
      if (e.ok) {
        return {
          mint: leg.mint,
          weight: leg.weight,
          ok: true,
          signature: e.signature,
          inAtomic: e.inAtomic,
          outAtomic: e.outAtomic,
          maker: e.maker,
          router: e.router,
        }
      }
      return {
        mint: leg.mint,
        weight: leg.weight,
        ok: false,
        reason: e.reason,
        detail: e.detail,
      }
    })

    const totalAtomic = BigInt(order.amount)
    const okCount = results.filter((r) => r.ok).length
    const allOk = okCount === results.length
    const filledInAtomic = results
      .filter((r): r is Extract<SwapLegResult, { ok: true }> => r.ok)
      .reduce((sum, r) => sum + BigInt(r.inAtomic), 0n)
    const remainingAtomic = totalAtomic - filledInAtomic

    const status: "completed" | "partial" | "failed" = allOk
      ? "completed"
      : okCount > 0
        ? "partial"
        : "failed"

    await step.run("finalize", () =>
      db
        .update(orders)
        .set({
          status,
          result: results,
          error:
            status === "completed"
              ? null
              : results
                  .filter((r): r is Extract<SwapLegResult, { ok: false }> => !r.ok)
                  .map((r) => `${r.mint}: ${r.reason} (${r.detail})`)
                  .join("; "),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId)),
    )

    if (status !== "completed" && remainingAtomic > 0n) {
      await step.sendEvent("queue-refund", {
        name: "deposit/refund",
        data: { orderId, amountAtomic: remainingAtomic.toString() },
      })
    }

    // Update the materialized holdings cache regardless of status — partial
    // and completed both add basket tokens; failed deposits also fire to
    // ensure consistency (no-op if no successful legs).
    if (status !== "failed") {
      await step.sendEvent("emit-holdings-update", {
        name: "holdings/update",
        data: { userId: order.userId, vaultId: order.vaultId },
      })
    }

    return { orderId, status, okCount, legCount: results.length }
  },
)

// ─── Stage 5: refund-deposit ────────────────────────────────────────────────
//
// Idempotent — checks order.refundSignature first. Server-signs an SPL
// transfer from Instinct → user's connected wallet. Inngest auto-retries
// the transfer step on Privy/RPC blip (retries: 3).

export const refundDeposit = inngest.createFunction(
  {
    id: "refund-deposit",
    concurrency: { limit: 5 },
    triggers: [{ event: "deposit/refund" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { orderId, amountAtomic } = event.data as {
      orderId: string
      amountAtomic: string
    }

    const [order] = await step.run("load-order", () =>
      db.select().from(orders).where(eq(orders.id, orderId)).limit(1),
    )
    if (!order) throw new Error(`Order ${orderId} not found`)
    if (order.refundSignature) {
      return { orderId, skipped: "already-refunded" }
    }

    const [userWallet] = await step.run("load-wallet", () =>
      db
        .select({
          privyWalletId: wallets.privyWalletId,
          instinctAddress: wallets.address,
          connectedAddress: wallets.connectedAddress,
        })
        .from(wallets)
        .where(eq(wallets.userId, order.userId))
        .limit(1),
    )
    if (!userWallet?.privyWalletId || !userWallet.connectedAddress) {
      throw new Error("Wallet not provisioned for refund")
    }

    const refund = await step.run("perform-refund", async () => {
      const r = await transferUsdc({
        fromWalletId: userWallet.privyWalletId!,
        fromAddress: userWallet.instinctAddress,
        toAddress: userWallet.connectedAddress!,
        amountAtomic: BigInt(amountAtomic),
      })
      if (!r.ok) throw new Error(`transferUsdc failed: ${r.detail}`)
      return r
    })

    await step.run("record-refund", () =>
      db
        .update(orders)
        .set({ refundSignature: refund.signature, updatedAt: new Date() })
        .where(eq(orders.id, orderId)),
    )

    return { orderId, refundSignature: refund.signature }
  },
)

// ═══════════════════════════════════════════════════════════════════════════
// WITHDRAW PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Aggregate a user's attributable basket for a vault from completed deposit
 * and withdrawal orders. Returns per-mint atomic balances representing what's
 * still owed to this user from this vault (in Instinct).
 */
async function computeBasketAttribution(
  userId: string,
  vaultId: string,
): Promise<Map<string, bigint>> {
  const orderRows = await db
    .select({ type: orders.type, status: orders.status, result: orders.result })
    .from(orders)
    .where(eq(orders.userId, userId))

  const basket = new Map<string, bigint>()
  for (const o of orderRows) {
    if (o.status !== "completed" && o.status !== "partial") continue
    for (const leg of o.result as SwapLegResult[]) {
      if (!leg.ok) continue
      const current = basket.get(leg.mint) ?? 0n
      if (o.type === "deposit") {
        basket.set(leg.mint, current + BigInt(leg.outAtomic))
      } else {
        basket.set(leg.mint, current - BigInt(leg.inAtomic))
      }
    }
  }

  // Filter to this vault's mints
  const vaultMints = await db
    .select({ address: stocks.address })
    .from(compositions)
    .innerJoin(stocks, eq(compositions.stockId, stocks.id))
    .where(eq(compositions.vaultId, vaultId))
  const allowed = new Set(vaultMints.map((m) => m.address))

  const filtered = new Map<string, bigint>()
  for (const [mint, amount] of basket) {
    if (allowed.has(mint) && amount > 0n) filtered.set(mint, amount)
  }
  return filtered
}

// ─── Stage 1: verify-withdraw ───────────────────────────────────────────────
//
// Loads the user's attributable basket for this vault. Validates non-zero
// position. Status: pending → processing. Emits withdraw/quote with the
// basket inline.

export const verifyWithdraw = inngest.createFunction(
  {
    id: "verify-withdraw",
    concurrency: { limit: 5 },
    triggers: [{ event: "withdraw/execute" }],
  },
  async ({ event, step }) => {
    const { orderId } = event.data as { orderId: string }

    const [order] = await step.run("load-order", () =>
      db.select().from(orders).where(eq(orders.id, orderId)).limit(1),
    )
    if (!order) throw new Error(`Order ${orderId} not found`)
    if (order.type !== "withdraw") throw new Error(`Order ${orderId} is not a withdraw`)
    if (order.status !== "pending") {
      return { orderId, skipped: order.status }
    }

    // Compute per-leg sell amounts. For full exit (order.amount == 0), sell
    // every basket token. For partial (order.amount > 0), price the basket
    // via Jupiter and sell each leg proportionally to hit the target USDC.
    //
    const plan = await step.run("compute-legs", async () => {
      const basketMap = await computeBasketAttribution(order.userId, order.vaultId)
      const basket: [string, bigint][] = [...basketMap.entries()]
      if (basket.length === 0) {
        return { kind: "empty" as const }
      }

      const targetAtomic = BigInt(order.amount)
      const isFullExit = targetAtomic === 0n

      if (isFullExit) {
        return {
          kind: "full" as const,
          legs: basket.map(([mint, atomic]) => ({
            mint,
            atomicStr: atomic.toString(),
          })),
        }
      }

      // Partial: need current prices to derive proportional sells
      const info = await fetchTokenInfo(basket.map(([mint]) => mint))
      const legValues: { mint: string; atomic: bigint; valueAtomic: bigint }[] = []
      let totalValueAtomic = 0n
      for (const [mint, atomic] of basket) {
        const tk = info.get(mint)
        if (!tk) {
          return {
            kind: "fail" as const,
            error: `no price for leg ${mint} — cannot compute partial withdraw`,
          }
        }
        const ui = Number(atomic) / 10 ** tk.decimals
        const valueAtomic = BigInt(Math.floor(ui * tk.usdPrice * 1e6))
        totalValueAtomic += valueAtomic
        legValues.push({ mint, atomic, valueAtomic })
      }

      if (targetAtomic > totalValueAtomic) {
        return {
          kind: "fail" as const,
          error: `requested ${targetAtomic} exceeds position value ${totalValueAtomic}`,
        }
      }

      // sell_atomic = leg.atomic × target / total_value
      // sell_value  = leg.valueAtomic × target / total_value
      const MIN_LEG_USDC_ATOMIC = 5_000_000n
      const legs = legValues.map(({ mint, atomic, valueAtomic }) => {
        const sellAtomic = (atomic * targetAtomic) / totalValueAtomic
        const sellValueAtomic = (valueAtomic * targetAtomic) / totalValueAtomic
        return { mint, atomicStr: sellAtomic.toString(), sellValueAtomic }
      })

      for (const l of legs) {
        if (l.sellValueAtomic < MIN_LEG_USDC_ATOMIC) {
          const minTarget = (MIN_LEG_USDC_ATOMIC * totalValueAtomic) / l.sellValueAtomic
          return {
            kind: "fail" as const,
            error: `Withdraw too small — leg ${l.mint} would sell below $5. Minimum withdraw ~ $${(Number(minTarget) / 1e6).toFixed(2)}`,
          }
        }
      }

      return {
        kind: "partial" as const,
        legs: legs.map((l) => ({ mint: l.mint, atomicStr: l.atomicStr })),
      }
    })

    if (plan.kind === "empty") {
      await step.run("fail-empty-position", () =>
        db
          .update(orders)
          .set({
            status: "failed",
            error: "No attributable position to withdraw from this vault",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId)),
      )
      return { orderId, status: "failed", stage: "verify-withdraw" }
    }
    if (plan.kind === "fail") {
      await step.run("fail-plan", () =>
        db
          .update(orders)
          .set({ status: "failed", error: plan.error, updatedAt: new Date() })
          .where(eq(orders.id, orderId)),
      )
      return { orderId, status: "failed", stage: "verify-withdraw" }
    }

    await step.run("mark-processing", () =>
      db
        .update(orders)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(orders.id, orderId)),
    )

    await step.sendEvent("emit-quote", {
      name: "withdraw/quote",
      data: { orderId, legs: plan.legs },
    })

    return {
      orderId,
      status: "processing",
      stage: "verify-withdraw",
      kind: plan.kind,
      legs: plan.legs.length,
    }
  },
)

// ─── Stage 2: quote-withdraw ────────────────────────────────────────────────
//
// Quotes each basket leg → USDC in parallel. Quote-gate: any failure aborts
// the entire withdrawal. No refund — nothing has moved.

export const quoteWithdraw = inngest.createFunction(
  {
    id: "quote-withdraw",
    concurrency: { limit: 5 },
    triggers: [{ event: "withdraw/quote" }],
  },
  async ({ event, step }) => {
    const { orderId, legs } = event.data as {
      orderId: string
      legs: { mint: string; atomicStr: string }[]
    }

    const [order] = await step.run("load-order", () =>
      db.select().from(orders).where(eq(orders.id, orderId)).limit(1),
    )
    if (!order) throw new Error(`Order ${orderId} not found`)
    if (order.status === "cancelled" || order.status === "failed") {
      return { orderId, skipped: order.status }
    }

    if (!isUsMarketOpen()) {
      await step.sleepUntil("wait-for-market-open", nextUsMarketOpen())
    }

    const [userWallet] = await step.run("load-wallet", () =>
      db
        .select({ instinctAddress: wallets.address })
        .from(wallets)
        .where(eq(wallets.userId, order.userId))
        .limit(1),
    )
    if (!userWallet) throw new Error("wallet missing")

    const solDrip = await step.run("ensure-sol", () =>
      ensureInstinctSolBalance(userWallet.instinctAddress),
    )
    if (!solDrip.ok) {
      await step.run("fail-no-sol", () =>
        db
          .update(orders)
          .set({
            status: "failed",
            error: `SOL drip failed: ${solDrip.detail}`,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId)),
      )
      return { orderId, status: "failed", stage: "quote-withdraw" }
    }

    const quotes = await step.run("quote-all", () =>
      Promise.all(
        legs.map((leg) =>
          quoteSwap({
            walletAddress: userWallet.instinctAddress,
            inputMint: leg.mint,
            outputMint: USDC_MINT,
            amount: BigInt(leg.atomicStr),
          }),
        ),
      ),
    )

    const failedQuotes = quotes
      .map((q, i) => ({ leg: legs[i], q }))
      .filter((x) => !x.q.ok)

    if (failedQuotes.length > 0) {
      await step.run("fail-no-route", () =>
        db
          .update(orders)
          .set({
            status: "failed",
            error: failedQuotes
              .map(
                (x) =>
                  `${x.leg.mint}: ${(x.q as { reason: string; detail: string }).reason} (${(x.q as { reason: string; detail: string }).detail})`,
              )
              .join("; "),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId)),
      )
      return { orderId, status: "failed", stage: "quote-withdraw" }
    }

    await step.sendEvent("emit-swap", {
      name: "withdraw/swap",
      data: { orderId, legs, quotes: quotes as Quote[] },
    })

    return { orderId, status: "processing", stage: "quote-withdraw", legs: legs.length }
  },
)

// ─── Stage 3: execute-withdraw ──────────────────────────────────────────────
//
// Signs and submits every sell in parallel. Status: processing → executing.

export const executeWithdraw = inngest.createFunction(
  {
    id: "execute-withdraw",
    concurrency: { limit: 5 },
    triggers: [{ event: "withdraw/swap" }],
  },
  async ({ event, step }) => {
    const { orderId, legs, quotes } = event.data as {
      orderId: string
      legs: { mint: string; atomicStr: string }[]
      quotes: Quote[]
    }

    const [order] = await step.run("load-order", () =>
      db.select().from(orders).where(eq(orders.id, orderId)).limit(1),
    )
    if (!order) throw new Error(`Order ${orderId} not found`)
    if (order.status === "cancelled" || order.status === "failed") {
      return { orderId, skipped: order.status }
    }

    const [userWallet] = await step.run("load-wallet", () =>
      db
        .select({ privyWalletId: wallets.privyWalletId })
        .from(wallets)
        .where(eq(wallets.userId, order.userId))
        .limit(1),
    )
    if (!userWallet?.privyWalletId) throw new Error("wallet not provisioned")

    const executions: ExecuteResult[] = await step.run(
      "execute-all",
      async () => {
        await db
          .update(orders)
          .set({ status: "executing", updatedAt: new Date() })
          .where(eq(orders.id, orderId))
        return Promise.all(
          quotes.map((q) => executeQuoted(q, userWallet.privyWalletId!)),
        )
      },
    )

    await step.sendEvent("emit-aggregate", {
      name: "withdraw/aggregate",
      data: { orderId, legs, executions },
    })

    return { orderId, status: "executing", stage: "execute-withdraw" }
  },
)

// ─── Stage 4: settle-withdraw ───────────────────────────────────────────────
//
// Aggregates execution results, sets terminal status, writes total USDC
// received into orders.amount. Emits withdraw/payout if user has an external
// connected wallet to send the USDC to.

export const settleWithdraw = inngest.createFunction(
  {
    id: "settle-withdraw",
    concurrency: { limit: 5 },
    triggers: [{ event: "withdraw/aggregate" }],
  },
  async ({ event, step }) => {
    const { orderId, legs, executions } = event.data as {
      orderId: string
      legs: { mint: string; atomicStr: string }[]
      executions: ExecuteResult[]
    }

    const [order] = await step.run("load-order", () =>
      db.select().from(orders).where(eq(orders.id, orderId)).limit(1),
    )
    if (!order) throw new Error(`Order ${orderId} not found`)

    const results: SwapLegResult[] = legs.map((leg, i) => {
      const e = executions[i]
      if (e.ok) {
        return {
          mint: leg.mint,
          weight: 0, // weight is not meaningful per-leg for withdraws; kept for schema parity
          ok: true,
          signature: e.signature,
          inAtomic: e.inAtomic,
          outAtomic: e.outAtomic,
          maker: e.maker,
          router: e.router,
        }
      }
      return {
        mint: leg.mint,
        weight: 0,
        ok: false,
        reason: e.reason,
        detail: e.detail,
      }
    })

    const okCount = results.filter((r) => r.ok).length
    const allOk = okCount === results.length
    const totalUsdcOut = results
      .filter((r): r is Extract<SwapLegResult, { ok: true }> => r.ok)
      .reduce((sum, r) => sum + BigInt(r.outAtomic), 0n)

    // Withdraw is all-or-nothing: any leg failure → failed, no payout, no
    // holdings update. Stranded basket from successful legs gets reconciled
    // manually (operator marks order completed + records payout sig).
    const status: "completed" | "failed" = allOk ? "completed" : "failed"

    await step.run("finalize", () =>
      db
        .update(orders)
        .set({
          status,
          result: results,
          amount: totalUsdcOut.toString(),
          error: allOk
            ? null
            : results
                .filter((r): r is Extract<SwapLegResult, { ok: false }> => !r.ok)
                .map((r) => `${r.mint}: ${r.reason} (${r.detail})`)
                .join("; "),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId)),
    )

    if (status === "completed") {
      await step.sendEvent("emit-holdings-update", {
        name: "holdings/update",
        data: { userId: order.userId, vaultId: order.vaultId },
      })
      if (totalUsdcOut > 0n) {
        await step.sendEvent("queue-payout", {
          name: "withdraw/payout",
          data: { orderId, amountAtomic: totalUsdcOut.toString() },
        })
      }
    }

    return { orderId, status, okCount, totalUsdcOut: totalUsdcOut.toString() }
  },
)

// ─── Stage 5: payout-withdraw ───────────────────────────────────────────────
//
// Transfers USDC from Instinct → user's connected wallet when they came in
// via an external wallet (Phantom etc.). For email-only users
// (connectedClientType='privy'), USDC stays in Instinct and the user can
// redeposit or pull it via a later explicit action.

export const payoutWithdraw = inngest.createFunction(
  {
    id: "payout-withdraw",
    concurrency: { limit: 5 },
    triggers: [{ event: "withdraw/payout" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { orderId, amountAtomic } = event.data as {
      orderId: string
      amountAtomic: string
    }

    const [order] = await step.run("load-order", () =>
      db.select().from(orders).where(eq(orders.id, orderId)).limit(1),
    )
    if (!order) throw new Error(`Order ${orderId} not found`)
    if (order.payoutSignature) {
      return { orderId, skipped: "already-paid-out" }
    }

    const [userWallet] = await step.run("load-wallet", () =>
      db
        .select({
          privyWalletId: wallets.privyWalletId,
          instinctAddress: wallets.address,
          connectedAddress: wallets.connectedAddress,
          connectedClientType: wallets.connectedClientType,
        })
        .from(wallets)
        .where(eq(wallets.userId, order.userId))
        .limit(1),
    )
    if (!userWallet?.privyWalletId || !userWallet.connectedAddress) {
      throw new Error("Wallet not provisioned for payout")
    }

    // Email-only users: USDC stays in Instinct.
    if (userWallet.connectedClientType !== "external") {
      return { orderId, skipped: "kept-in-instinct" }
    }

    const payout = await step.run("perform-payout", async () => {
      const r = await transferUsdc({
        fromWalletId: userWallet.privyWalletId!,
        fromAddress: userWallet.instinctAddress,
        toAddress: userWallet.connectedAddress!,
        amountAtomic: BigInt(amountAtomic),
      })
      if (!r.ok) throw new Error(`transferUsdc failed: ${r.detail}`)
      return r
    })

    await step.run("record-payout", () =>
      db
        .update(orders)
        .set({ payoutSignature: payout.signature, updatedAt: new Date() })
        .where(eq(orders.id, orderId)),
    )

    return { orderId, payoutSignature: payout.signature }
  },
)

// ═══════════════════════════════════════════════════════════════════════════
// HOLDINGS MATERIALIZER
// ═══════════════════════════════════════════════════════════════════════════
//
// Recomputes a (user, vault) holdings row from settled orders. Emitted by:
//   - verifyQuote (deposit finalize)
//   - settleWithdraw (withdraw finalize)
//
// Recomputes from scratch each invocation → idempotent on retry, no
// double-counting risk. O(N orders for that user+vault), but only fires once
// per settled order.

export const updateHoldings = inngest.createFunction(
  {
    id: "update-holdings",
    concurrency: { limit: 5 },
    triggers: [{ event: "holdings/update" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { userId, vaultId } = event.data as {
      userId: string
      vaultId: string
    }

    const settled = await step.run("load-orders", () =>
      db
        .select({
          type: orders.type,
          amount: orders.amount,
          result: orders.result,
        })
        .from(orders)
        .where(
          and(
            eq(orders.userId, userId),
            eq(orders.vaultId, vaultId),
            inArray(orders.status, ["completed", "partial"]),
          ),
        )
        .orderBy(asc(orders.createdAt)),
    )

    // Proportional cost-basis walk. Deposits add `amount` USDC and the
    // basket tokens received. Withdraws reduce cost basis by the fraction
    // of the position sold — recovered from leg.inAtomic / basket_before[mint]
    // (every leg sold at the same fraction by the worker's construction).
    let investedAtomic = 0n
    const basketMap = new Map<string, bigint>()

    for (const o of settled) {
      if (o.type === "deposit") {
        investedAtomic += BigInt(o.amount)
        for (const leg of o.result as SwapLegResult[]) {
          if (!leg.ok) continue
          basketMap.set(
            leg.mint,
            (basketMap.get(leg.mint) ?? 0n) + BigInt(leg.outAtomic),
          )
        }
        continue
      }

      // withdraw — recover fractionSold from any successful leg
      const okLegs = (o.result as SwapLegResult[]).filter(
        (l): l is Extract<SwapLegResult, { ok: true }> => l.ok,
      )
      if (okLegs.length === 0) continue

      const sample = okLegs.find((l) => (basketMap.get(l.mint) ?? 0n) > 0n)
      if (sample) {
        const before = basketMap.get(sample.mint)!
        const sold = BigInt(sample.inAtomic)
        // costBasisSold = invested × sold / before  (single division for precision)
        const costBasisSold =
          before > 0n ? (investedAtomic * sold) / before : investedAtomic
        investedAtomic -= costBasisSold
        if (investedAtomic < 0n) investedAtomic = 0n
      }

      for (const leg of okLegs) {
        basketMap.set(
          leg.mint,
          (basketMap.get(leg.mint) ?? 0n) - BigInt(leg.inAtomic),
        )
      }
    }

    const basket: Record<string, string> = {}
    for (const [mint, atomic] of basketMap) {
      if (atomic > 0n) basket[mint] = atomic.toString()
    }
    const invested =
      Object.keys(basket).length === 0 || investedAtomic <= 0n
        ? "0"
        : investedAtomic.toString()

    await step.run("upsert", () =>
      db
        .insert(holdings)
        .values({ userId, vaultId, basket, investedUsdc: invested })
        .onConflictDoUpdate({
          target: [holdings.userId, holdings.vaultId],
          set: {
            basket,
            investedUsdc: invested,
            updatedAt: new Date(),
          },
        }),
    )

    return { userId, vaultId, mints: Object.keys(basket).length, invested }
  },
)

// ─── Snapshots (unchanged) ──────────────────────────────────────────────────

/**
 * Daily snapshot of OHLC for every stock in the catalog. Pulls from Pyth
 * Benchmarks (free, public) and upserts into `stock_prices` keyed by
 * (stock_id, date). Cron fires at 02:00 UTC — after US equity market close
 * with buffer for end-of-day Pyth aggregation.
 *
 * Tickers without a `PYTH_SYMBOLS` mapping are skipped silently.
 */
export const snapshotStockPrices = inngest.createFunction(
  {
    id: "snapshot-stock-prices",
    triggers: [{ cron: "0 2 * * *" }],
  },
  async ({ step }) => {
    const catalog = await step.run("load-stocks", () =>
      db.select({ id: stocks.id, ticker: stocks.ticker }).from(stocks),
    )

    for (const stock of catalog) {
      await step.run(`price-${stock.ticker}`, async () => {
        const pythSymbol = PYTH_SYMBOLS[stock.ticker]
        if (!pythSymbol) return

        const now = Math.floor(Date.now() / 1000)
        const from = now - 3 * 86_400
        const url = `${PYTH_BENCHMARKS_URL}?symbol=${encodeURIComponent(
          pythSymbol,
        )}&resolution=D&from=${from}&to=${now}`

        const res = await fetch(url)
        if (!res.ok) return
        const json = (await res.json()) as {
          s: string
          t?: number[]
          o?: number[]
          h?: number[]
          l?: number[]
          c?: number[]
        }
        if (json.s !== "ok" || !json.t?.length) return

        const rows: typeof stockPrices.$inferInsert[] = []
        for (let i = 0; i < json.t.length; i++) {
          const date = new Date(json.t[i] * 1000).toISOString().slice(0, 10)
          rows.push({
            stockId: stock.id,
            date,
            open: String(json.o![i]),
            high: String(json.h![i]),
            low: String(json.l![i]),
            close: String(json.c![i]),
          })
        }

        await db
          .insert(stockPrices)
          .values(rows)
          .onConflictDoUpdate({
            target: [stockPrices.stockId, stockPrices.date],
            set: {
              open: sql`excluded.open`,
              high: sql`excluded.high`,
              low: sql`excluded.low`,
              close: sql`excluded.close`,
            },
          })
      })
    }
  },
)

/**
 * Daily recompute of the per-vault NAV growth index from `stock_prices`.
 */
export const snapshotVaultNav = inngest.createFunction(
  {
    id: "snapshot-vault-nav",
    triggers: [{ cron: "15 2 * * *" }],
  },
  async ({ step }) => {
    const allVaults = await step.run("load-vaults", () =>
      db.select({ id: vaults.id }).from(vaults),
    )

    for (const v of allVaults) {
      await step.run(`nav-${v.id}`, async () => {
        const rows = await db
          .select({
            date: stockPrices.date,
            stockId: compositions.stockId,
            weight: compositions.weight,
            close: stockPrices.close,
          })
          .from(compositions)
          .innerJoin(stockPrices, eq(stockPrices.stockId, compositions.stockId))
          .where(eq(compositions.vaultId, v.id))

        const stockIds = [...new Set(rows.map((r) => r.stockId))]
        if (!stockIds.length) return

        const closeByStockDate = new Map<string, Map<string, number>>()
        const weightByStock = new Map<string, number>()
        for (const r of rows) {
          let m = closeByStockDate.get(r.stockId)
          if (!m) {
            m = new Map()
            closeByStockDate.set(r.stockId, m)
          }
          m.set(r.date, Number(r.close))
          weightByStock.set(r.stockId, r.weight)
        }

        const dateSets = stockIds.map(
          (id) => new Set(closeByStockDate.get(id)!.keys()),
        )
        const commonDates = [...dateSets[0]]
          .filter((d) => dateSets.every((s) => s.has(d)))
          .sort()
        if (!commonDates.length) return

        const startDate = commonDates[0]
        const startPriceByStock = new Map<string, number>()
        for (const id of stockIds) {
          startPriceByStock.set(id, closeByStockDate.get(id)!.get(startDate)!)
        }

        const series = commonDates.map((date) => {
          let nav = 0
          for (const id of stockIds) {
            const w = weightByStock.get(id)! / 10_000
            const price = closeByStockDate.get(id)!.get(date)!
            const start = startPriceByStock.get(id)!
            nav += w * (price / start)
          }
          return { vaultId: v.id, date, value: (nav * 100).toFixed(4) }
        })

        const BATCH = 500
        for (let i = 0; i < series.length; i += BATCH) {
          await db
            .insert(vaultNav)
            .values(series.slice(i, i + BATCH))
            .onConflictDoUpdate({
              target: [vaultNav.vaultId, vaultNav.date],
              set: { value: sql`excluded.value` },
            })
        }
      })
    }
  },
)
