import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core"

// ── Enums ───────────────────────────────────────────────

export const orderTypeEnum = pgEnum("order_type", ["deposit", "withdraw"])

export const orderStatusEnum = pgEnum("order_status", [
  "pending",       // order created, waiting for USDC transfer
  "funded",        // USDC received in server wallet
  "processing",    // submitted to Symmetry (buyVaultTx/sellVaultTx)
  "completed",     // vault tokens minted/USDC returned
  "failed",        // something went wrong
  "cancelled",     // user cancelled
])

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

// ── Vaults ──────────────────────────────────────────────

export const vaults = pgTable("vaults", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  vaultAddress: text("vault_address").notNull().unique(),
  vaultMint: text("vault_mint").notNull().unique(),
  depositFeeBps: integer("deposit_fee_bps").notNull().default(0),
  withdrawFeeBps: integer("withdraw_fee_bps").notNull().default(50),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── Compositions ────────────────────────────────────────

export const compositions = pgTable("compositions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  vaultId: uuid("vault_id").notNull().references(() => vaults.id),
  stockId: uuid("stock_id").notNull().references(() => stocks.id),
  weightBps: integer("weight_bps").notNull(),
})

// ── Orders ──────────────────────────────────────────────

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),               // Privy user ID
  vaultId: uuid("vault_id").notNull().references(() => vaults.id),
  type: orderTypeEnum("type").notNull(),
  amount: numeric("amount").notNull(),              // raw amount in smallest unit
  shares: numeric("shares"),                        // vault tokens (filled after processing)
  status: orderStatusEnum("status").notNull().default("pending"),
  signature: text("signature"),                // Symmetry tx sig
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── User Wallets ────────────────────────────────────────

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),   // Privy user ID
  walletId: text("wallet_id").notNull(),         // Privy server wallet ID
  address: text("address").notNull(),            // Solana address
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ── Positions ───────────────────────────────────────────

export const positions = pgTable("positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),               // Privy user ID
  vaultId: uuid("vault_id").notNull().references(() => vaults.id),
  shares: numeric("shares").notNull().default("0"), // total vault tokens held
  amount: numeric("amount").notNull().default("0"), // total USDC deposited in 8 decimal
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
