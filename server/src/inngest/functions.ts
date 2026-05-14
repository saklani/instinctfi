import { Connection, PublicKey } from "@solana/web3.js"
import { isNotNull, eq, sql } from "drizzle-orm"

import { db } from "../db/index.js"
import {
  compositions,
  stockPrices,
  stocks,
  vaultNav,
  vaults,
  walletBalances,
} from "../db/schema.js"
import { fetchVault } from "../lib/symmetry.js"
import { PYTH_BENCHMARKS_URL, PYTH_SYMBOLS } from "../lib/pyth-symbols.js"
import { inngest } from "./client.js"

const connection = new Connection(process.env.RPC_URL!, "confirmed")

/**
 * Periodic snapshot of the top-20 holders per deployed vault, written to
 * `wallet_balances`. Powers the /api/leaderboard endpoint.
 *
 * - `vault.nav` from Postgres is a growth INDEX, not USD/token. We pull the
 *   USD price per token from the Symmetry SDK (`fetchVault` already chains
 *   `loadVaultPrice`).
 * - `vault.price` is `totalValue / supplyOutstanding` — USD per **atomic** LP
 *   unit, NOT per UI token. Multiply by the raw atomic amount, not `uiAmount`.
 * - Vault token decimals are 6 (verified on-chain). `getTokenLargestAccounts`
 *   returns `uiAmount` already normalized.
 */
export const snapshotLeaderboard = inngest.createFunction(
  {
    id: "snapshot-leaderboard",
    triggers: [{ cron: "*/5 * * * *" }],
  },
  async ({ step }) => {
    const deployed = await step.run("load-vaults", () =>
      db
        .select({ id: vaults.id, mint: vaults.mint, address: vaults.address })
        .from(vaults)
        .where(isNotNull(vaults.mint)),
    )

    for (const vault of deployed) {
      await step.run(`snapshot-${vault.id}`, async () => {
        if (!vault.mint || !vault.address) return

        const sdkVault = await fetchVault(vault.address)
        const pricePerToken = Number((sdkVault as { price?: number | string }).price ?? 0)
        if (!pricePerToken) return

        const { value: largest } = await connection.getTokenLargestAccounts(
          new PublicKey(vault.mint),
        )
        if (!largest.length) return

        const tokenAccountKeys = largest.map((l) => l.address)
        const { value: parsed } =
          await connection.getMultipleParsedAccounts(tokenAccountKeys)

        // Dedupe by owner — a wallet can hold the same mint across multiple
        // token accounts (e.g. legacy ATA + a new one), and both can land in
        // the top-20. Insert would then violate uniq_wallet_vault.
        const byOwner = new Map<string, { raw: bigint; ui: number }>()
        for (let i = 0; i < largest.length; i++) {
          const info = parsed[i]
          if (!info) continue
          const data = info.data as {
            parsed?: {
              info?: {
                owner: string
                tokenAmount: { uiAmount: number | null; amount: string }
              }
            }
          }
          const owner = data.parsed?.info?.owner
          const ui = data.parsed?.info?.tokenAmount?.uiAmount ?? 0
          const raw = data.parsed?.info?.tokenAmount?.amount ?? "0"
          if (!owner || ui === 0) continue
          const existing = byOwner.get(owner)
          if (existing) {
            existing.raw += BigInt(raw)
            existing.ui += ui
          } else {
            byOwner.set(owner, { raw: BigInt(raw), ui })
          }
        }

        if (!byOwner.size) return

        const rows: typeof walletBalances.$inferInsert[] = []
        for (const [owner, { raw, ui }] of byOwner) {
          rows.push({
            address: owner,
            vaultId: vault.id,
            balance: raw.toString(),
            balanceUi: String(ui),
            valueUsd: String(Number(raw) * pricePerToken),
          })
        }

        await db
          .delete(walletBalances)
          .where(eq(walletBalances.vaultId, vault.id))
        await db.insert(walletBalances).values(rows)
      })
    }
  },
)

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

        // Fetch a 3-day window so weekends/holidays still produce a candle.
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
 *
 * `vault_nav.value` is a growth INDEX (rebased weighted sum), not USD-per-LP:
 *   NAV(t) = 100 · Σ (wᵢ/10000) · priceᵢ(t) / priceᵢ(start)
 *
 * "start" = the earliest date where every constituent has a `stock_prices`
 * row (full-coverage common date). The whole series is recomputed each day
 * and upserted — idempotent, self-heals if a prior day's stock price was
 * missing and later landed. Runs ~15 min after `snapshotStockPrices`.
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

        // Common-coverage dates: present for every constituent.
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
