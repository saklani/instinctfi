/**
 * Import per-token OHLCV CSVs from assets/data/ into the stock_prices table.
 *
 * Reads files matching `{TICKER}_{from}_{to}.csv` (skips `_NAV_` files),
 * looks up stocks.id by ticker, and bulk-upserts into stock_prices.
 *
 * Usage:
 *   bun run scripts/import-stock-prices.ts
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { sql as drizzleSql, eq } from "drizzle-orm"
import { readdir } from "node:fs/promises"
import { stocks, stockPrices } from "../server/src/db/schema"

const DATA_DIR = "assets/data"
const BATCH_SIZE = 500

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

interface Row {
  date: string
  open: string
  high: string
  low: string
  close: string
}

function parseCsv(text: string): Row[] {
  const lines = text.trim().split("\n")
  const out: Row[] = []
  for (let i = 1; i < lines.length; i++) {
    const [date, open, high, low, close] = lines[i].split(",")
    if (!date || !open || !high || !low || !close) continue
    out.push({ date, open, high, low, close })
  }
  return out
}

function tickerFromFilename(name: string): string | null {
  // {TICKER}_{from}_{to}.csv — TICKER is alphanumeric, no underscores
  const m = name.match(/^([A-Za-z0-9]+)_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.csv$/)
  return m?.[1] ?? null
}

async function main() {
  const entries = await readdir(DATA_DIR)
  const candidates: { ticker: string; file: string }[] = []

  for (const file of entries) {
    if (file.includes("_NAV_")) continue
    const ticker = tickerFromFilename(file)
    if (!ticker) continue
    candidates.push({ ticker, file })
  }

  // Pick the longest CSV per ticker (largest file = widest date range)
  const byTicker = new Map<string, { file: string; size: number }>()
  for (const c of candidates) {
    const size = Bun.file(`${DATA_DIR}/${c.file}`).size
    const prev = byTicker.get(c.ticker)
    if (!prev || size > prev.size) {
      byTicker.set(c.ticker, { file: c.file, size })
    }
  }

  console.log(`Found ${byTicker.size} ticker CSVs.\n`)

  const allStocks = await db.select({ id: stocks.id, ticker: stocks.ticker }).from(stocks)
  const stockIdByTicker = new Map(allStocks.map((s) => [s.ticker, s.id]))

  let totalRows = 0
  for (const [ticker, { file }] of byTicker) {
    const stockId = stockIdByTicker.get(ticker)
    if (!stockId) {
      console.log(`  – ${ticker}: no matching stock in DB, skipping`)
      continue
    }

    const text = await Bun.file(`${DATA_DIR}/${file}`).text()
    const rows = parseCsv(text)
    if (!rows.length) {
      console.log(`  – ${ticker}: empty CSV, skipping`)
      continue
    }

    const values = rows.map((r) => ({
      stockId,
      date: r.date,
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
    }))

    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = values.slice(i, i + BATCH_SIZE)
      await db
        .insert(stockPrices)
        .values(batch)
        .onConflictDoUpdate({
          target: [stockPrices.stockId, stockPrices.date],
          set: {
            open: drizzleSql`excluded.open`,
            high: drizzleSql`excluded.high`,
            low: drizzleSql`excluded.low`,
            close: drizzleSql`excluded.close`,
          },
        })
    }

    totalRows += rows.length
    console.log(`  ✓ ${ticker}: ${rows.length} rows`)
  }

  console.log(`\nDone. ${totalRows} rows upserted across ${byTicker.size} tickers.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
