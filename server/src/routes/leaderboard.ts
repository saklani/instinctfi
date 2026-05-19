import { Hono } from "hono"
import { eq } from "drizzle-orm"

import { db } from "../db/index.js"
import { holdings, wallets } from "../db/schema.js"
import { fetchTokenInfo } from "../lib/jupiter-prices.js"

const app = new Hono()

const TOP_N = 50

// GET /api/leaderboard — public ranking of users by current portfolio value.
// Derived from the materialized `holdings` table: basket atomics priced live
// via Jupiter, summed across all of a user's vaults. Displayed identity is
// the user's connected wallet address (Phantom or Privy-embedded).

app.get("/", async (c) => {
  const rows = await db
    .select({
      userId: holdings.userId,
      basket: holdings.basket,
      connectedAddress: wallets.connectedAddress,
    })
    .from(holdings)
    .innerJoin(wallets, eq(wallets.userId, holdings.userId))

  const active = rows.filter(
    (r) => r.connectedAddress && Object.keys(r.basket).length > 0,
  )
  if (active.length === 0) return c.json({ wallets: [] })

  const allMints = new Set<string>()
  for (const r of active) for (const m of Object.keys(r.basket)) allMints.add(m)

  const tokenInfo = await fetchTokenInfo([...allMints])

  const totals = new Map<string, { address: string; valueUsd: number }>()
  for (const r of active) {
    let value = 0
    for (const [mint, atomicStr] of Object.entries(r.basket)) {
      const info = tokenInfo.get(mint)
      if (!info) continue
      const ui = Number(BigInt(atomicStr)) / 10 ** info.decimals
      value += ui * info.usdPrice
    }
    if (value <= 0) continue
    const existing = totals.get(r.userId)
    if (existing) existing.valueUsd += value
    else totals.set(r.userId, { address: r.connectedAddress!, valueUsd: value })
  }

  const ranked = [...totals.values()]
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, TOP_N)

  return c.json({ wallets: ranked })
})

export default app
