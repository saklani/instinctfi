import { Connection, PublicKey } from "@solana/web3.js"
import { isNotNull, eq, sql } from "drizzle-orm"

import { db } from "../db/index.js"
import { stockPrices, stocks, vaults, walletBalances } from "../db/schema.js"
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
