import { Connection } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const VAULT_ADDRESS = "EeDideZqgCwCuQFd4241ZsZRVBcSgVYf1rPStqzov9qc"

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed")
  const sdk = new SymmetryCore({ connection, network: "devnet" })

  console.log("Checking rebalance intents...")
  const intents = await sdk.fetchVaultRebalanceIntents(VAULT_ADDRESS)
  console.log("Found", intents.length, "rebalance intent(s)")

  for (const intent of intents) {
    console.log("\nIntent:", (intent as any).publicKey?.toBase58?.() ?? "unknown")
    console.log(JSON.stringify(intent, (_, v) =>
      typeof v === "bigint" ? v.toString() : v, 2
    ))
  }

  console.log("\nChecking vault intents...")
  const vaultIntents = await sdk.fetchVaultIntents(VAULT_ADDRESS)
  console.log("Found", vaultIntents.length, "vault intent(s)")
}

main().catch(console.error)
