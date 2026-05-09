import type {
  stocks,
  stockPrices,
  vaults,
  compositions,
  vaultNav,
  wallets,
} from "../db/schema.js"

// ── DB row types ────────────────────────────────────────

export type Stock = typeof stocks.$inferSelect
export type StockPrice = typeof stockPrices.$inferSelect
export type Vault = typeof vaults.$inferSelect
export type Composition = typeof compositions.$inferSelect
export type VaultNav = typeof vaultNav.$inferSelect
export type Wallet = typeof wallets.$inferSelect

// ── HTTP / Hono ─────────────────────────────────────────

export type AuthEnv = { Variables: { userId: string } }

// ── API response shapes ─────────────────────────────────

export type VaultComposition = { weight: number; stock: Stock } // weight in bps
