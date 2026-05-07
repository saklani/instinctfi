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
    // Pull every (date, weight, close) for this vault
    const rows = await db
      .select({
        date: stockPrices.date,
        weight: compositions.weight,
        close: stockPrices.close,
      })
      .from(compositions)
      .innerJoin(stockPrices, eq(stockPrices.stockId, compositions.stockId))
      .where(eq(compositions.vaultId, v.id))

    const tokenCount = await db
      .select({ stockId: compositions.stockId })
      .from(compositions)
      .where(eq(compositions.vaultId, v.id))
    const expected = tokenCount.length
    if (expected === 0) {
      console.log(`  · ${v.name}: no compositions, skipping`)
      continue
    }

    // Aggregate per date; only keep dates with full coverage.
    const byDate = new Map<string, { sum: number; count: number }>()
    for (const r of rows) {
      const slot = byDate.get(r.date) ?? { sum: 0, count: 0 }
      slot.sum += Number(r.close) * (r.weight / 10_000)
      slot.count++
      byDate.set(r.date, slot)
    }

    const series = [...byDate.entries()]
      .filter(([, x]) => x.count === expected)
      .map(([date, x]) => ({
        vaultId: v.id,
        date,
        value: x.sum.toFixed(4),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

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
