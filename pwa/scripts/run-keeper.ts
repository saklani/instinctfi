/**
 * Run the keeper to process pending deposits and mint vault tokens.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/run-keeper.ts
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { SymmetryCore, KeeperMonitor } from "@symmetry-hq/sdk"

const RPC_URL = "https://api.devnet.solana.com"
const NETWORK = "devnet" as const
const VAULT_ADDRESS = "EeDideZqgCwCuQFd4241ZsZRVBcSgVYf1rPStqzov9qc"

function loadKeypair(): Keypair {
  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error("Set PRIVATE_KEY env var")
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(pk)))
}

function createWallet(keypair: Keypair) {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async <T>(tx: T): Promise<T> => {
      ;(tx as any).sign([keypair])
      return tx
    },
    signAllTransactions: async <T>(txs: T[]): Promise<T[]> => {
      txs.forEach((tx: any) => tx.sign([keypair]))
      return txs
    },
    payer: keypair,
  }
}

async function main() {
  const keypair = loadKeypair()
  const wallet = createWallet(keypair)
  const connection = new Connection(RPC_URL)

  console.log("Keeper wallet:", keypair.publicKey.toBase58())
  console.log("Balance:", (await connection.getBalance(keypair.publicKey)) / LAMPORTS_PER_SOL, "SOL")

  const keeper = new KeeperMonitor({
    wallet,
    connection,
    network: NETWORK,
    priorityFee: 50_000,
  })

  console.log("\nRunning keeper (will process pending deposits)...")
  console.log("Press Ctrl+C to stop.\n")

  let runs = 0
  const maxRuns = 10 // Run 10 cycles then stop

  while (runs < maxRuns) {
    try {
      await keeper.update()
      console.log(`[${new Date().toISOString()}] Keeper cycle ${runs + 1}/${maxRuns} complete`)
    } catch (e: any) {
      console.error(`[${new Date().toISOString()}] Keeper error:`, e.message)
    }

    runs++
    if (runs < maxRuns) {
      await new Promise((r) => setTimeout(r, 10_000))
    }
  }

  // Check vault state after keeper runs
  const sdk = new SymmetryCore({ connection, network: NETWORK })
  let vault = await sdk.fetchVault(VAULT_ADDRESS)
  vault = await sdk.loadVaultPrice(vault)

  console.log("\n═══════════════════════════════════════")
  console.log("Vault state after keeper:")
  console.log("  TVL:", vault.tvl?.toString())
  console.log("  Price:", vault.price?.toString())
  console.log("  Supply:", vault.formatted?.supply_outstanding)
  console.log("═══════════════════════════════════════")
}

main().catch(console.error)
