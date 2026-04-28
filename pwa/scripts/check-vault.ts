import { Connection } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const VAULT_ADDRESS = "EeDideZqgCwCuQFd4241ZsZRVBcSgVYf1rPStqzov9qc"

async function main() {
  const connection = new Connection("https://api.devnet.solana.com")
  const sdk = new SymmetryCore({ connection, network: "devnet" })

  let vault = await sdk.fetchVault(VAULT_ADDRESS)
  vault = await sdk.loadVaultPrice(vault)

  const info = vault.formatted!
  console.log("Name:", info.name)
  console.log("Symbol:", info.symbol)
  console.log("TVL:", vault.tvl?.toString())
  console.log("Price:", vault.price?.toString())
  console.log("Supply:", info.supply_outstanding)

  console.log("\nComposition:")
  for (const asset of info.composition) {
    if (!asset.active) continue
    console.log(`  ${asset.mint}: weight=${asset.weight / 100}%, amount=${asset.amount}`)
  }
}

main().catch(console.error)
