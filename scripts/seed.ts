/**
 * Seed the database with stocks, vault, and compositions.
 *
 * Usage:
 *   bun run scripts/seed.ts
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { stocks, vaults, compositions } from "../server/src/db/schema"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const STOCKS = [
  { name: "Nvidia", ticker: "NVDAx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/NVDAx.png", description: "Leading GPU and AI chip manufacturer", address: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", decimals: 8 },
  { name: "Alphabet", ticker: "GOOGLx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/GOOGLx.png", description: "Parent company of Google", address: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", decimals: 8 },
  { name: "Amazon", ticker: "AMZNx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/AMZNx.png", description: "E-commerce and cloud computing giant", address: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", decimals: 8 },
  { name: "Apple", ticker: "AAPLx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/AAPLx.png", description: "Consumer electronics and software", address: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", decimals: 8 },
  { name: "Meta", ticker: "METAx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/METAx.png", description: "Social media and metaverse company", address: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", decimals: 8 },
  { name: "Palantir", ticker: "PLTRx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/PLTRx.png", description: "Data analytics and AI software", address: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4", decimals: 8 },
  { name: "Microsoft", ticker: "MSFTx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/MSFTx.png", description: "Enterprise software and cloud computing", address: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX", decimals: 8 },
  { name: "Tesla", ticker: "TSLAx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/TSLAx.png", description: "Electric vehicles and clean energy", address: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", decimals: 8 },
]

const WEIGHTS: Record<string, number> = {
  NVDAx: 2200,
  GOOGLx: 1700,
  AMZNx: 1300,
  AAPLx: 1000,
  METAx: 1000,
  PLTRx: 1000,
  MSFTx: 1000,
  TSLAx: 800,
}

async function main() {
  console.log("Seeding stocks...")
  const stockIds: Record<string, string> = {}

  for (const stock of STOCKS) {
    const [row] = await db
      .insert(stocks)
      .values(stock)
      .onConflictDoUpdate({ target: stocks.address, set: { name: stock.name, ticker: stock.ticker, description: stock.description, imageUrl: stock.imageUrl } })
      .returning()
    stockIds[stock.ticker] = row.id
    console.log(`  ${stock.ticker}: ${row.id}`)
  }

  console.log("\nSeeding vault...")
  const [vault] = await db
    .insert(vaults)
    .values({
      name: "Pelosi Tracker",
      description: "Curated basket tracking Nancy Pelosi's disclosed stock holdings",
      vaultAddress: "G54nsrBx9a59YVqiqk2Sg3yX9wQauRz5MEugdWDjvmsf",
      vaultMint: "FXcxe5f3AwkJZRaoYFuGME7rEXS4NmBxZPYKVh3Q4bnD",
      depositFeeBps: 0,
      withdrawFeeBps: 50,
    })
    .onConflictDoUpdate({ target: vaults.vaultAddress, set: { name: "Pelosi Tracker" } })
    .returning()
  console.log(`  Vault: ${vault.id}`)

  console.log("\nSeeding compositions...")
  for (const [ticker, weightBps] of Object.entries(WEIGHTS)) {
    await db
      .insert(compositions)
      .values({ vaultId: vault.id, stockId: stockIds[ticker], weightBps })
      .onConflictDoNothing()
    console.log(`  ${ticker}: ${weightBps} bps`)
  }

  console.log("\nDone!")
}

main().catch(console.error)
