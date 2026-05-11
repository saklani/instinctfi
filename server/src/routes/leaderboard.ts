import { Hono } from "hono"
import { sql } from "drizzle-orm"

import { db } from "../db/index.js"
import { walletBalances } from "../db/schema.js"

const app = new Hono()

app.get("/", async (c) => {
  const limitParam = Number(c.req.query("limit") ?? 100)
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 100, 1), 500)

  const rows = await db
    .select({
      address: walletBalances.address,
      vaultCount: sql<number>`count(distinct ${walletBalances.vaultId})::int`,
      valueUsd: sql<string>`sum(${walletBalances.valueUsd})`,
    })
    .from(walletBalances)
    .groupBy(walletBalances.address)
    .orderBy(sql`sum(${walletBalances.valueUsd}) desc`)
    .limit(limit)

  return c.json({
    wallets: rows.map((r) => ({
      address: r.address,
      vaultCount: r.vaultCount,
      valueUsd: Number(r.valueUsd),
    })),
  })
})

export default app
