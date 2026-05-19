import {
  pgEnum,
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  numeric,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core"

// Per-leg execution record persisted on each deposit/withdraw order. Atomic
// amounts are strings (bigint isn't JSON-serializable). One entry per
// composition leg the worker attempted.
export type SwapLegResult =
  | {
      mint: string
      weight: number
      ok: true
      signature: string
      inAtomic: string
      outAtomic: string
      maker: string | null
      router: string
    }
  | {
      mint: string
      weight: number
      ok: false
      reason: string
      detail: string
    }

// ── Enums ───────────────────────────────────────────────

export const orderTypeEnum = pgEnum("order_type", ["deposit", "withdraw"])

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "executing",
  "completed",
  "partial",
  "failed",
  "cancelled",
])

// ── Stocks ──────────────────────────────────────────────

export const stocks = pgTable("stocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),              // "Nvidia"
  ticker: text("ticker").notNull(),          // "NVDAx"
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  address: text("address").notNull().unique(), // Solana mint
  decimals: integer("decimals").notNull().default(8),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ── Stock Prices ────────────────────────────────────────

export const stockPrices = pgTable(
  "stock_prices",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    stockId: uuid("stock_id")
      .notNull()
      .references(() => stocks.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    open: text("open").notNull(),
    high: text("high").notNull(),
    low: text("low").notNull(),
    close: text("close").notNull(),
  },
  (t) => [uniqueIndex("uniq_stock_price_date").on(t.stockId, t.date)],
)

// ── Vaults ──────────────────────────────────────────────

export const vaults = pgTable("vaults", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  address: text("address").unique(),
  mint: text("mint").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── Compositions ────────────────────────────────────────

export const compositions = pgTable("compositions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  vaultId: uuid("vault_id").notNull().references(() => vaults.id),
  stockId: uuid("stock_id").notNull().references(() => stocks.id),
  weight: integer("weight").notNull(), // bps
})

// ── Vault NAV (precomputed weighted-sum series) ─────────

export const vaultNav = pgTable(
  "vault_nav",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vaults.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    value: text("value").notNull(),
  },
  (t) => [uniqueIndex("uniq_vault_nav_date").on(t.vaultId, t.date)],
)

// ── Wallets ─────────────────────────────────────────────
//
// Two-wallet model:
//   - privyWalletId + address point at the user's INSTINCT wallet (a Privy
//     server wallet we create on signup; we own/sign it).
//   - connectedAddress is the user's CONNECTED wallet (what they signed in
//     with — Phantom for external, auto-Privy-embedded for email). They sign
//     transfers from there themselves.
//   - connectedClientType drives withdraw-destination logic.

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),       // Privy user ID
  privyWalletId: text("privy_wallet_id"),           // Instinct wallet ID
  address: text("address").notNull(),               // Instinct wallet address
  connectedAddress: text("connected_address"),       // user's signing wallet
  connectedClientType: text("connected_client_type"), // 'privy' | 'external'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── Holdings (materialized position cache) ──────────────
//
// Per (user, vault) snapshot of basket tokens + net invested USDC. Updated
// by the `updateHoldings` Inngest function after every settled deposit or
// withdraw. /api/portfolio reads from here — O(1) lookups instead of
// aggregating orders.result on every request.

export const holdings = pgTable(
  "holdings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vaults.id, { onDelete: "cascade" }),
    basket: jsonb("basket").$type<Record<string, string>>().notNull().default({}),
    investedUsdc: numeric("invested_usdc").notNull().default("0"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("uniq_holdings_user_vault").on(t.userId, t.vaultId)],
)

// ── Orders (deposit / withdraw intents) ─────────────────

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  vaultId: uuid("vault_id").notNull().references(() => vaults.id, { onDelete: "cascade" }),
  type: orderTypeEnum("type").notNull(),
  amount: numeric("amount").notNull(),         // USDC atomic units
  status: orderStatusEnum("status").notNull().default("pending"),
  signature: text("signature").unique(),       // user-signed USDC transfer tx sig (deposits); unique prevents replay
  refundSignature: text("refund_signature"),   // server-signed USDC refund tx (Instinct → connected) on partial/failed/cancelled deposits
  payoutSignature: text("payout_signature"),   // server-signed USDC payout tx for withdrawals (Instinct → connected)
  result: jsonb("result").$type<SwapLegResult[]>().notNull().default([]),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
