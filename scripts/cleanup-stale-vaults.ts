/**
 * One-off cleanup: delete the placeholder vault rows that were seeded before
 * the real on-chain BFI/BJB vaults existed.
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { vaults, compositions } from "../server/src/db/schema"
import { inArray } from "drizzle-orm"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const PLACEHOLDERS = [
  "BFI11111111111111111111111111111111111111111",
  "BJB11111111111111111111111111111111111111111",
  "AFFC1111111111111111111111111111111111111111",
]

async function main() {
  const rows = await db.select().from(vaults)
  const stale = rows.filter((r) => PLACEHOLDERS.includes(r.address))
  if (!stale.length) {
    console.log("No stale rows.")
    return
  }
  console.log("Deleting stale vaults:")
  for (const r of stale) console.log(`  ${r.name} (${r.id}) — ${r.address}`)
  const ids = stale.map((r) => r.id)
  await db.delete(compositions).where(inArray(compositions.vaultId, ids))
  await db.delete(vaults).where(inArray(vaults.id, ids))
  console.log("Done.")
}

main().catch(console.error)
