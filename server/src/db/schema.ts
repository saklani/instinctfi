import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  numeric,
  pgEnum,
  jsonb,
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
  name: text("name").notNull(),          // "Nvidia"
  ticker: text("ticker").notNull(),      // "NVDAx"
  symbol: text("symbol").notNull(),      // "NVDA"
  description: text("description"),
  mint: text("mint").notNull().unique(),  // Solana mint address
  pythAccount: text("pyth_account"),      // Pyth oracle address
  decimals: integer("decimals").notNull().default(8),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ── Vaults ──────────────────────────────────────────────

export const vaults = pgTable("vaults", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),                    // "Pelosi Tracker"
  description: text("description"),
  imageUrl: text("image_url"),
  vaultAddress: text("vault_address").notNull().unique(),  // Symmetry vault PDA
  vaultMint: text("vault_mint").notNull().unique(),        // Vault token mint
  composition: jsonb("composition").notNull().$type<
    { stockId: string; weightBps: number }[]
  >(),
  depositFeeBps: integer("deposit_fee_bps").notNull().default(0),
  withdrawFeeBps: integer("withdraw_fee_bps").notNull().default(50),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── Orders ──────────────────────────────────────────────

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),               // Privy user ID
  userWallet: text("user_wallet").notNull(),        // user's wallet address
  serverWallet: text("server_wallet").notNull(),    // Privy server wallet for this user
  vaultId: uuid("vault_id").notNull().references(() => vaults.id),
  type: orderTypeEnum("type").notNull(),
  amountUsdc: numeric("amount_usdc").notNull(),     // USDC amount (human readable)
  amountLamports: text("amount_lamports"),          // raw amount in smallest unit
  shares: numeric("shares"),                        // vault tokens (filled after processing)
  status: orderStatusEnum("status").notNull().default("pending"),
  txSignature: text("tx_signature"),                // Symmetry tx sig
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── User Wallets ────────────────────────────────────────

export const userWallets = pgTable("user_wallets", {
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
  costBasisUsdc: numeric("cost_basis_usdc").notNull().default("0"), // total USDC deposited
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
