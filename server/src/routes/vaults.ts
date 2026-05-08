import { Hono } from "hono"
import { db } from "../db/index.js"
import { vaults, compositions, stocks, vaultNav } from "../db/schema.js"
import { and, asc, desc, eq, gte, sql } from "drizzle-orm"
import type { VaultComposition } from "../lib/types.js"

const app = new Hono()

/** Latest two `vault_nav` rows → headline NAV + 24h delta. */
function snapshotFromRows(rows: { value: string }[]) {
  const nav = rows[0] ? Number(rows[0].value) : null
  const prev = rows[1] ? Number(rows[1].value) : null
  const delta24h =
    nav != null && prev != null && prev !== 0 ? (nav - prev) / prev : null
  return { nav, delta24h }
}

// ── Routes ──────────────────────────────────────────────

app.get("/", async (c) => {
  const [allVaults, compRows, navRows] = await Promise.all([
    db.select().from(vaults),
    db
      .select({
        vaultId: compositions.vaultId,
        weight: compositions.weight,
        stock: stocks,
      })
      .from(compositions)
      .innerJoin(stocks, eq(compositions.stockId, stocks.id)),
    // Latest two NAV rows per vault via window function
    db.execute<{ vault_id: string; value: string }>(sql`
      SELECT vault_id, value FROM (
        SELECT vault_id, value, date,
          ROW_NUMBER() OVER (PARTITION BY vault_id ORDER BY date DESC) AS rn
        FROM vault_nav
      ) t WHERE rn <= 2 ORDER BY vault_id, date DESC
    `),
  ])

  const compsByVault = new Map<string, VaultComposition[]>()
  for (const r of compRows) {
    const arr = compsByVault.get(r.vaultId) ?? []
    arr.push({ weight: r.weight, stock: r.stock })
    compsByVault.set(r.vaultId, arr)
  }

  const navByVault = new Map<string, { value: string }[]>()
  for (const r of navRows.rows) {
    const arr = navByVault.get(r.vault_id) ?? []
    arr.push({ value: r.value })
    navByVault.set(r.vault_id, arr)
  }

  return c.json(
    allVaults.map((v) => ({
      ...v,
      compositions: compsByVault.get(v.id) ?? [],
      ...snapshotFromRows(navByVault.get(v.id) ?? []),
    })),
  )
})

app.get("/:id", async (c) => {
  const id = c.req.param("id")
  const [vault] = await db.select().from(vaults).where(eq(vaults.id, id)).limit(1)

  if (!vault) return c.json({ error: "Vault not found" }, 404)

  const [compRows, navRows] = await Promise.all([
    db
      .select({ weight: compositions.weight, stock: stocks })
      .from(compositions)
      .innerJoin(stocks, eq(compositions.stockId, stocks.id))
      .where(eq(compositions.vaultId, id)),
    db
      .select({ value: vaultNav.value })
      .from(vaultNav)
      .where(eq(vaultNav.vaultId, id))
      .orderBy(desc(vaultNav.date))
      .limit(2),
  ])

  return c.json({ ...vault, compositions: compRows, ...snapshotFromRows(navRows) })
})

// GET /api/vaults/:id/performance — all-time return computed from `vault_nav`
// (latest value vs. earliest value).
app.get("/:id/performance", async (c) => {
  const id = c.req.param("id")

  const [firstRow, lastRow] = await Promise.all([
    db
      .select({ value: vaultNav.value })
      .from(vaultNav)
      .where(eq(vaultNav.vaultId, id))
      .orderBy(asc(vaultNav.date))
      .limit(1),
    db
      .select({ value: vaultNav.value })
      .from(vaultNav)
      .where(eq(vaultNav.vaultId, id))
      .orderBy(desc(vaultNav.date))
      .limit(1),
  ])

  const first = firstRow[0] ? Number(firstRow[0].value) : null
  const last = lastRow[0] ? Number(lastRow[0].value) : null
  const allTime =
    first != null && last != null && first !== 0 ? (last - first) / first : null

  return c.json({ allTime })
})

// GET /api/vaults/:id/nav?days=N — precomputed weighted NAV time series.
// Source: `vault_nav` table, populated by scripts/compute-vault-nav.ts.
app.get("/:id/nav", async (c) => {
  const id = c.req.param("id")
  const daysParam = Number(c.req.query("days") ?? 365)
  const days = Math.min(Math.max(Number.isFinite(daysParam) ? daysParam : 365, 1), 1825)
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  const rows = await db
    .select({ date: vaultNav.date, value: vaultNav.value })
    .from(vaultNav)
    .where(and(eq(vaultNav.vaultId, id), gte(vaultNav.date, cutoff)))
    .orderBy(asc(vaultNav.date))

  return c.json(rows.map((r) => ({ date: r.date, value: Number(r.value) })))
})

export default app
