/**
 * Seed the database with stocks, vaults, and compositions.
 *
 * Usage:
 *   bun run scripts/seed.ts
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { inArray } from "drizzle-orm"
import { stocks, vaults, compositions } from "../server/src/db/schema"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const STOCKS = [
  // ── xStocks (Symmetry / Backed) ──────────────────────────────────
  { name: "Nvidia", ticker: "NVDAx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/NVDAx.png", description: "Leading GPU and AI chip manufacturer", address: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", decimals: 8 },
  { name: "Alphabet", ticker: "GOOGLx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/GOOGLx.png", description: "Parent company of Google", address: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", decimals: 8 },
  { name: "Amazon", ticker: "AMZNx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/AMZNx.png", description: "E-commerce and cloud computing giant", address: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", decimals: 8 },
  { name: "Apple", ticker: "AAPLx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/AAPLx.png", description: "Consumer electronics and software", address: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", decimals: 8 },
  { name: "Meta", ticker: "METAx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/METAx.png", description: "Social media and metaverse company", address: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", decimals: 8 },
  { name: "Palantir", ticker: "PLTRx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/PLTRx.png", description: "Data analytics and AI software", address: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4", decimals: 8 },
  { name: "Microsoft", ticker: "MSFTx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/MSFTx.png", description: "Enterprise software and cloud computing", address: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX", decimals: 8 },
  { name: "Tesla", ticker: "TSLAx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/TSLAx.png", description: "Electric vehicles and clean energy", address: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", decimals: 8 },
  { name: "Robinhood", ticker: "HOODx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/HOODx.png", description: "Commission-free trading platform", address: "XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg", decimals: 8 },
  { name: "Coinbase", ticker: "COINx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/COINx.png", description: "Cryptocurrency exchange", address: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu", decimals: 8 },
  { name: "Circle", ticker: "CRCLx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/CRCLx.png", description: "USDC issuer and crypto finance", address: "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1", decimals: 8 },
  { name: "Strategy", ticker: "MSTRx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/MSTRx.png", description: "Bitcoin treasury company", address: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ", decimals: 8 },
  { name: "Strategy Prf Series A", ticker: "STRCx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/STRCx.png", description: "Strategy preferred stock", address: "Xs78JED6PFZxWc2wCEPspZW9kL3Se5J7L5TChKgsidH", decimals: 8 },
  { name: "Eli Lilly", ticker: "LLYx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/LLYx.png", description: "GLP-1 / metabolic-optimization leader", address: "Xsnuv4omNoHozR6EEW5mXkw8Nrny5rB3jVfLqi6gKMH", decimals: 8 },
  { name: "Novo Nordisk", ticker: "NVOx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/NVOx.png", description: "GLP-1 anchor — weight-loss / longevity", address: "XsfAzPzYrYjd4Dpa9BU3cusBsvWfVB9gBcyGC87S57n", decimals: 8 },
  { name: "Thermo Fisher", ticker: "TMOx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/TMOx.png", description: "Lab and diagnostics infrastructure", address: "Xs8drBWy3Sd5QY3aifG9kt9KFs2K3PGZmx7jWrsrk57", decimals: 8 },
  { name: "Danaher", ticker: "DHRx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/DHRx.png", description: "Biomarker and medical-grade testing tools", address: "Xseo8tgCZfkHxWS9xbFYeKFyMSbWEvZGFV1Gh53GtCV", decimals: 8 },
  { name: "Galaxy Digital", ticker: "GLXYx", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/GLXYx.png", description: "Crypto financial services", address: "Xs3c2aZenyRQwXjki5MDxJEJ2km27ef2rWQMFWx7QKJ", decimals: 8 },

  // ── Ondo tokenized equities ──────────────────────────────────────
  { name: "Vertex Pharmaceuticals (Ondo)", ticker: "VRTXon", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/VRTXon.png", description: "Frontier biotech with real revenue and pipeline", address: "FL7QzUq58pvkDxkftJm7RqRWgqYEFZwXuvAMsUnondo", decimals: 9 },
  { name: "Rocket Lab (Ondo)", ticker: "RKLBon", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/RKLBon.png", description: "Space company that actually executes", address: "E9VQY3VnrpVSekFByzRmfeK1kxgM3UiKCoVVbdUondo", decimals: 9 },
  { name: "UnitedHealth (Ondo)", ticker: "UNHon", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/UNHon.png", description: "Scaled healthcare winner", address: "kPBGL8vAwKN3UGmr9cjkM2dU79SC3nzTC9yu7F8ondo", decimals: 9 },
  { name: "Hims & Hers (Ondo)", ticker: "HIMSon", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/HIMSon.png", description: "Consumer-health operator turning digital care into a real business", address: "bdh3njeo19d2TBLAKTGvCWdSoArfVw8uZBAJHY4ondo", decimals: 9 },
  { name: "Vanguard Real Estate (Ondo)", ticker: "VNQon", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/VNQon.png", description: "Listed real estate index", address: "F3dMJ9H137YUNc9cpN3gBWDSq4MSRbTFtojH65Uondo", decimals: 9 },
  { name: "Broadcom (Ondo)", ticker: "AVGOon", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/AVGOon.png", description: "AI / infrastructure semiconductor anchor", address: "1FWZtdWN7y38BSXGzbs8D6Shk88oL9atDNgbVz9ondo", decimals: 9 },
  { name: "Meta (Ondo)", ticker: "METAon", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/METAon.png", description: "Core platform exposure", address: "fDxs5y12E7x7jBwCKBXGqt71uJmCWsAQ3Srkte6ondo", decimals: 9 },
  { name: "CrowdStrike (Ondo)", ticker: "CRWDon", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/CRWDon.png", description: "Security / software edge", address: "cdKfoNjbXgnSuxvoajhtH3uixfZhq1YXhQsS1Rwondo", decimals: 9 },

  // ── Solana-native ────────────────────────────────────────────────
  { name: "Solana", ticker: "SOL", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/SOL.png", description: "High-performance L1 blockchain", address: "So11111111111111111111111111111111111111112", decimals: 9 },
  { name: "USDC", ticker: "USDC", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/USDC.png", description: "USD stablecoin by Circle", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  { name: "BIO Protocol", ticker: "BIO", imageUrl: "https://ik.imagekit.io/8dj2mc8pj/BIO.png", description: "Onchain biotech / DeSci anchor", address: "bioJ9JTqW62MLz7UKHU69gtKhPpGi1BQhccj2kmSvUJ", decimals: 9 },
]

// ── Vault definitions ──────────────────────────────────────────────

interface VaultDef {
  name: string
  description: string
  imageUrl: string
  vaultAddress: string
  vaultMint: string
  depositFeeBps: number
  withdrawFeeBps: number
  weights: Record<string, number>
}

const VAULTS: VaultDef[] = [
  {
    name: "NOT INSIDER TRADING",
    description: "Curated basket tracking the highest-conviction recurring holdings across politician disclosure books — large-cap tech compounders.",
    imageUrl: "https://ik.imagekit.io/8dj2mc8pj/not_insider_trading.png",
    vaultAddress: "G54nsrBx9a59YVqiqk2Sg3yX9wQauRz5MEugdWDjvmsf",
    vaultMint: "FXcxe5f3AwkJZRaoYFuGME7rEXS4NmBxZPYKVh3Q4bnD",
    depositFeeBps: 0,
    withdrawFeeBps: 50,
    weights: {
      GOOGLx: 1600,
      NVDAx: 1500,
      AVGOon: 1400,
      AMZNx: 1200,
      METAon: 1100,
      MSFTx: 1100,
      AAPLx: 1100,
      CRWDon: 1000,
    },
  },
  {
    name: "REVERSE CHAMATH",
    description: "What SPACs should have been — names with real revenue, real execution, real staying power.",
    imageUrl: "https://ik.imagekit.io/8dj2mc8pj/reverse_chamath.png",
    vaultAddress: "BT5UCXo1hhv2gndwByf4WQSJ43n6FZ1XhBA8QjGNQ9kE",
    vaultMint: "C8nquiV3ZLwbh3d3hBgPyYaKM5tKvYyS15u2fLPmcfV9",
    depositFeeBps: 0,
    withdrawFeeBps: 50,
    weights: {
      RKLBon: 2800,
      UNHon: 2600,
      HIMSon: 1900,
      VRTXon: 1700,
      VNQon: 1000,
    },
  },
  {
    name: "Bald Founder Index",
    description: "Long conviction on founders who let their hairline go gracefully.",
    imageUrl: "https://ik.imagekit.io/8dj2mc8pj/bald_founder_index.png",
    vaultAddress: "EPE5SRsPYUUgYefm7sSns4BYfi5HxMdPuNDfchoYzN9s",
    vaultMint: "9TUeXbEgrS4ohSkEUjnRbRuSQv3zaryYMWs64M6cCeD",
    depositFeeBps: 0,
    withdrawFeeBps: 50,
    weights: {
      AMZNx: 3100,
      COINx: 2700,
      MSFTx: 2200,
      GLXYx: 2000,
    },
  },
  {
    name: "Peptidemaxxing",
    description: "Longevity, biomarkers, GLP-1, and frontier biotech — exposure to the measurement-obsessed protocol economy.",
    imageUrl: "https://ik.imagekit.io/8dj2mc8pj/peptidemaxxing.png",
    vaultAddress: "79Ls18aStxgxYouEwrynr2u4xTtsLWmU8ogap6Nfjy7m",
    vaultMint: "2BXw5F5oBTage2B5GZWWdftHKWGynza4AGtcBxBTqnk1",
    depositFeeBps: 0,
    withdrawFeeBps: 50,
    weights: {
      LLYx: 2800,
      NVOx: 2300,
      TMOx: 1700,
      DHRx: 1500,
      VRTXon: 1200,
      BIO: 500,
    },
  },
]

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding stocks...")
  const stockIds: Record<string, string> = {}

  // Pull existing rows by address so we can skip already-seeded stocks.
  const existing = await db
    .select({ id: stocks.id, ticker: stocks.ticker, address: stocks.address })
    .from(stocks)
    .where(inArray(stocks.address, STOCKS.map((s) => s.address)))

  const existingByAddress = new Map(existing.map((r) => [r.address, r]))

  const toInsert = STOCKS.filter((s) => !existingByAddress.has(s.address))

  for (const stock of STOCKS) {
    const ex = existingByAddress.get(stock.address)
    if (ex) {
      stockIds[stock.ticker] = ex.id
      console.log(`  · ${stock.ticker}: ${ex.id} (existing)`)
    }
  }

  if (toInsert.length > 0) {
    const inserted = await db.insert(stocks).values(toInsert).returning()
    for (const row of inserted) {
      stockIds[row.ticker] = row.id
      console.log(`  + ${row.ticker}: ${row.id}`)
    }
  }

  for (const vault of VAULTS) {
    console.log(`\nSeeding vault: ${vault.name}...`)
    const [row] = await db
      .insert(vaults)
      .values({
        name: vault.name,
        description: vault.description,
        imageUrl: vault.imageUrl,
        vaultAddress: vault.vaultAddress,
        vaultMint: vault.vaultMint,
        depositFeeBps: vault.depositFeeBps,
        withdrawFeeBps: vault.withdrawFeeBps,
      })
      .onConflictDoUpdate({ target: vaults.vaultAddress, set: { name: vault.name, description: vault.description, imageUrl: vault.imageUrl } })
      .returning()
    console.log(`  Vault: ${row.id}`)

    console.log("  Compositions:")
    for (const [ticker, weightBps] of Object.entries(vault.weights)) {
      if (!stockIds[ticker]) {
        console.log(`    ✗ ${ticker}: stock not found`)
        continue
      }
      await db
        .insert(compositions)
        .values({ vaultId: row.id, stockId: stockIds[ticker], weightBps })
        .onConflictDoNothing()
      console.log(`    ${ticker}: ${weightBps} bps`)
    }
  }

  console.log("\nDone!")
}

main().catch(console.error)
