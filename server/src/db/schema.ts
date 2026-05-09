import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core"

// ── Stocks ──────────────────────────────────────────────

export const stocks = pgTable("stocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),              // "Nvidia"
  ticker: text("ticker").notNull(),          // "NVDAx"
  imageUrl: text("image_url").notNull(),         
  description: text("description"),
  address: text("address").notNull().unique(), // Solana mint / contract address
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
    date: text("date").notNull(), // YYYY-MM-DD
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
    date: text("date").notNull(), // YYYY-MM-DD
    value: text("value").notNull(),
  },
  (t) => [uniqueIndex("uniq_vault_nav_date").on(t.vaultId, t.date)],
)

// ── Wallets ─────────────────────────────────────────────

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(), // Privy user ID
  address: text("address").notNull(),         // user's connected Solana wallet
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
