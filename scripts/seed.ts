/**
 * Seed the database with stocks, vault, and compositions.
 *
 * Usage:
 *   bun run scripts/seed.ts
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { eq } from "drizzle-orm"
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
  { name: "Robinhood", ticker: "HOODx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/HOODx.png", description: "Commission-free trading platform", address: "XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg", decimals: 8 },
  { name: "Coinbase", ticker: "COINx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/COINx.png", description: "Cryptocurrency exchange platform", address: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu", decimals: 8 },
  { name: "Circle", ticker: "CRCLx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/CRCLx.png", description: "Digital financial technology and USDC issuer", address: "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1", decimals: 8 },
  { name: "Strategy", ticker: "MSTRx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/MSTRx.png", description: "Bitcoin treasury and enterprise analytics", address: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ", decimals: 8 },
  { name: "Strategy Prf Shs", ticker: "STRCx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/STRCx.png", description: "Strategy Variable Rate Perpetual Stretch Preferred Shares Series A", address: "Xs78JED6PFZxWc2wCEPspZW9kL3Se5J7L5TChKgsidH", decimals: 8 },
]

const PELOSI_WEIGHTS: Record<string, number> = {
  NVDAx: 3400,
  GOOGLx: 2600,
  AMZNx: 2000,
  AAPLx: 1000,
  MSFTx: 1000,
}

const AFFC_WEIGHTS: Record<string, number> = {
  HOODx: 2600,
  COINx: 2600,
  CRCLx: 2100,
  MSTRx: 2100,
  STRCx: 600,
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

  console.log("\nSeeding Pelosi Tracker vault...")
  const [pelosiVault] = await db
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
  console.log(`  Vault: ${pelosiVault.id}`)

  console.log("\nSeeding Pelosi compositions...")
  await db.delete(compositions).where(eq(compositions.vaultId, pelosiVault.id))
  for (const [ticker, weightBps] of Object.entries(PELOSI_WEIGHTS)) {
    await db
      .insert(compositions)
      .values({ vaultId: pelosiVault.id, stockId: stockIds[ticker], weightBps })
    console.log(`  ${ticker}: ${weightBps} bps`)
  }

  console.log("\nSeeding Anti Finance Finance Club vault...")
  const [affcVault] = await db
    .insert(vaults)
    .values({
      name: "Anti Finance Finance Club",
      description: "Curated basket of crypto-native public equities",
      vaultAddress: "BT5UCXo1hhv2gndwByf4WQSJ43n6FZ1XhBA8QjGNQ9kE",
      vaultMint: "C8nquiV3ZLwbh3d3hBgPyYaKM5tKvYyS15u2fLPmcfV9",
      depositFeeBps: 0,
      withdrawFeeBps: 50,
    })
    .onConflictDoUpdate({ target: vaults.vaultAddress, set: { name: "Anti Finance Finance Club" } })
    .returning()
  console.log(`  Vault: ${affcVault.id}`)

  console.log("\nSeeding AFFC compositions...")
  await db.delete(compositions).where(eq(compositions.vaultId, affcVault.id))
  for (const [ticker, weightBps] of Object.entries(AFFC_WEIGHTS)) {
    await db
      .insert(compositions)
      .values({ vaultId: affcVault.id, stockId: stockIds[ticker], weightBps })
    console.log(`  ${ticker}: ${weightBps} bps`)
  }

  console.log("\nDone!")
}

main().catch(console.error)
