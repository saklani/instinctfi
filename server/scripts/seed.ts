/**
 * Seed the database with stocks and the Pelosi Tracker vault.
 *
 * Usage:
 *   bun run scripts/seed.ts
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { stocks, vaults } from "../src/db/schema"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const STOCKS = [
  {
    name: "Nvidia",
    ticker: "NVDAx",
    imageUrl: "",
    description: "Leading GPU and AI chip manufacturer",
    address: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    decimals: 8,
  },
  {
    name: "Alphabet",
    ticker: "GOOGLx",
    imageUrl: "",
    description: "Parent company of Google",
    address: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
    decimals: 8,
  },
  {
    name: "Amazon",
    ticker: "AMZNx",
    imageUrl: "",
    description: "E-commerce and cloud computing giant",
    address: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
    decimals: 8,
  },
  {
    name: "Apple",
    ticker: "AAPLx",
    imageUrl: "",
    description: "Consumer electronics and software",
    address: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
  },
  {
    name: "Meta",
    ticker: "METAx",
    imageUrl: "",
    description: "Social media and metaverse company",
    address: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
    decimals: 8,
  },
  {
    name: "Palantir",
    ticker: "PLTRx",
    imageUrl: "",
    description: "Data analytics and AI software",
    address: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4",
    decimals: 8,
  },
  {
    name: "Microsoft",
    ticker: "MSFTx",
    imageUrl: "",
    description: "Enterprise software and cloud computing",
    address: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
    decimals: 8,
  },
  {
    name: "Tesla",
    ticker: "TSLAx",
    imageUrl: "",
    description: "Electric vehicles and clean energy",
    address: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    decimals: 8,
  },
]

async function main() {
  console.log("Seeding stocks...")

  const stockIds: Record<string, string> = {}

  for (const stock of STOCKS) {
    const [inserted] = await db
      .insert(stocks)
      .values(stock)
      .onConflictDoUpdate({
        target: stocks.address,
        set: {
          name: stock.name,
          ticker: stock.ticker,
          description: stock.description,
          imageUrl: stock.imageUrl,
        },
      })
      .returning()

    stockIds[stock.ticker] = inserted.id
    console.log(`  ${stock.ticker}: ${inserted.id}`)
  }

  console.log("\nSeeding vault...")

  const composition = [
    { stockId: stockIds["NVDAx"], weightBps: 2200 },
    { stockId: stockIds["GOOGLx"], weightBps: 1700 },
    { stockId: stockIds["AMZNx"], weightBps: 1300 },
    { stockId: stockIds["AAPLx"], weightBps: 1000 },
    { stockId: stockIds["METAx"], weightBps: 1000 },
    { stockId: stockIds["PLTRx"], weightBps: 1000 },
    { stockId: stockIds["MSFTx"], weightBps: 1000 },
    { stockId: stockIds["TSLAx"], weightBps: 800 },
  ]

  const [vault] = await db
    .insert(vaults)
    .values({
      name: "Pelosi Tracker",
      description:
        "Curated basket tracking Nancy Pelosi's disclosed stock holdings",
      vaultAddress: "G54nsrBx9a59YVqiqk2Sg3yX9wQauRz5MEugdWDjvmsf",
      vaultMint: "FXcxe5f3AwkJZRaoYFuGME7rEXS4NmBxZPYKVh3Q4bnD",
      composition,
      depositFeeBps: 0,
      withdrawFeeBps: 50,
    })
    .onConflictDoUpdate({
      target: vaults.vaultAddress,
      set: {
        name: "Pelosi Tracker",
        description:
          "Curated basket tracking Nancy Pelosi's disclosed stock holdings",
        composition,
      },
    })
    .returning()

  console.log(`  Vault: ${vault.id}`)
  console.log(`  Address: ${vault.vaultAddress}`)

  console.log("\nDone!")
}

main().catch(console.error)
