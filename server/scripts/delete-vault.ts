// One-off: delete a vault by name match. Compositions are removed
// explicitly; vault_nav / orders / holdings cascade via FK.
//
// Usage: bun run scripts/delete-vault.ts "test-nvda"

import { eq, ilike } from "drizzle-orm"
import { db } from "../src/db/index.js"
import { compositions, vaults } from "../src/db/schema.js"

const nameArg = process.argv[2]
if (!nameArg) {
  console.error("Usage: bun run scripts/delete-vault.ts <name>")
  process.exit(1)
}

const matches = await db
  .select({ id: vaults.id, name: vaults.name })
  .from(vaults)
  .where(ilike(vaults.name, nameArg))

if (matches.length === 0) {
  console.error(`No vault matching "${nameArg}"`)
  process.exit(1)
}
if (matches.length > 1) {
  console.error(`Multiple vaults matched "${nameArg}":`)
  for (const m of matches) console.error(`  ${m.id}  ${m.name}`)
  console.error("Refine the name.")
  process.exit(1)
}

const target = matches[0]
console.log(`Deleting vault ${target.id} (${target.name})…`)

await db.delete(compositions).where(eq(compositions.vaultId, target.id))
await db.delete(vaults).where(eq(vaults.id, target.id))

console.log("Done.")
process.exit(0)
