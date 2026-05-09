/**
 * Precompute the weighted-sum NAV time series for every vault and upsert into
 * the `vault_nav` table. Run after `import-stock-prices.ts` so the source data
 * is fresh.
 *
 * Usage:
 *   bun --env-file=scripts/.env run scripts/compute-vault-nav.ts
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { eq, sql as drizzleSql } from "drizzle-orm"
import {
  vaults,
  compositions,
  stockPrices,
  vaultNav,
} from "../server/src/db/schema"

const BATCH_SIZE = 1000

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function main() {
  const allVaults = await db.select().from(vaults)
  console.log(`Computing NAV series for ${allVaults.length} vaults…\n`)

  let totalRows = 0
  for (const v of allVaults) {
    // Pull every (date, stockId, weight, close) for this vault
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
    if (stockIds.length === 0) {
      console.log(`  · ${v.name}: no compositions, skipping`)
      continue
    }

    // Index closes by (stockId, date) and collect weights
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

    // Common-coverage dates: dates present for every constituent
    const dateSets = stockIds.map((id) => new Set(closeByStockDate.get(id)!.keys()))
    const commonDates = [...dateSets[0]]
      .filter((d) => dateSets.every((s) => s.has(d)))
      .sort()

    if (!commonDates.length) {
      console.log(`  – ${v.name}: 0 full-coverage dates`)
      continue
    }

    // Rebased market-value index: NAV(t) = 100 · Σ (wᵢ/10000) · priceᵢ(t)/priceᵢ(start)
    const startDate = commonDates[0]
    const startPriceByStock = new Map<string, number>()
    for (const id of stockIds) {
      startPriceByStock.set(id, closeByStockDate.get(id)!.get(startDate)!)
    }

    const series = commonDates
      .map((date) => {
        let nav = 0
        for (const id of stockIds) {
          const w = weightByStock.get(id)! / 10_000
          const price = closeByStockDate.get(id)!.get(date)!
          const start = startPriceByStock.get(id)!
          nav += w * (price / start)
        }
        return { vaultId: v.id, date, value: (nav * 100).toFixed(4) }
      })

    if (!series.length) {
      console.log(`  – ${v.name}: 0 full-coverage dates`)
      continue
    }

    // Bulk upsert in batches
    for (let i = 0; i < series.length; i += BATCH_SIZE) {
      const chunk = series.slice(i, i + BATCH_SIZE)
      await db
        .insert(vaultNav)
        .values(chunk)
        .onConflictDoUpdate({
          target: [vaultNav.vaultId, vaultNav.date],
          set: { value: drizzleSql`excluded.value` },
        })
    }
    totalRows += series.length
    console.log(
      `  ✓ ${v.name.padEnd(30)} ${String(series.length).padStart(4)} rows  ` +
        `${series[0].date} → ${series[series.length - 1].date}`,
    )
  }

  console.log(`\nDone. ${totalRows} NAV rows upserted.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
