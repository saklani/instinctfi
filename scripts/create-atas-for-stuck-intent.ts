/**
 * Create Token-2022 ATAs on the Privy wallet so the stuck redeemTokensTx can settle.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/create-atas-for-stuck-intent.ts
 */
import {
  Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, ComputeBudgetProgram,
} from "@solana/web3.js"
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token"

const RPC_URL = process.env.RPC_URL!
const OWNER = new PublicKey("3Y5dYzQGsXRTKiuZQPTUQvH7XZP8nBPRwi5LSRitGPaZ")
const MINTS = [
  "Xs78JED6PFZxWc2wCEPspZW9kL3Se5J7L5TChKgsidH",
  "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu",
  "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ",
  "XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg",
].map((m) => new PublicKey(m))

const pk = process.env.PRIVATE_KEY!
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(pk)))
const c = new Connection(RPC_URL, "confirmed")

console.log("Payer:", payer.publicKey.toBase58())
console.log("Owner:", OWNER.toBase58())

const tx = new Transaction()
tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }))
for (const mint of MINTS) {
  const ata = getAssociatedTokenAddressSync(mint, OWNER, true, TOKEN_2022_PROGRAM_ID)
  console.log("  ata:", ata.toBase58(), "mint:", mint.toBase58())
  tx.add(createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, ata, OWNER, mint, TOKEN_2022_PROGRAM_ID))
}

const sig = await sendAndConfirmTransaction(c, tx, [payer], { commitment: "confirmed" })
console.log("\nSig:", sig)
