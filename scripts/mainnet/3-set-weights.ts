/**
 * Step 3: Set token weights
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/mainnet/3-set-weights.ts <vault_address>
 */

import { Connection, Keypair } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=7ab8b174-ab40-4c2a-aef7-93a19dbd364c"

const vaultAddress = process.argv[2]
if (!vaultAddress) {
  console.error("Usage: bun run scripts/mainnet/3-set-weights.ts <vault_address>")
  process.exit(1)
}

const WEIGHTS = [
  { mint: "XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg", weight_bps: 2600 }, // HOODx
  { mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu", weight_bps: 2600 }, // COINx
  { mint: "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1", weight_bps: 2100 }, // CRCLx
  { mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ", weight_bps: 2100 }, // MSTRx
  { mint: "Xs78JED6PFZxWc2wCEPspZW9kL3Se5J7L5TChKgsidH", weight_bps: 600 },  // STRCx
]

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
  const connection = new Connection(RPC_URL, "confirmed")

  console.log("Wallet:", keypair.publicKey.toBase58())
  console.log("Vault:", vaultAddress)

  const sdk = new SymmetryCore({ connection, network: "mainnet", priorityFee: 100_000 })

  const vault = await sdk.fetchVault(vaultAddress)
  console.log("Vault name:", vault.formatted?.name)
  console.log("Tokens in vault:", vault.formatted?.composition.filter((a: any) => a.active).length)

  console.log("\nSetting weights...")
  const total = WEIGHTS.reduce((s, w) => s + w.weight_bps, 0)
  console.log("Total weight:", total, "(should be 10000)")

  const weightsTx = await sdk.updateWeightsTx(
    { vault: vaultAddress, manager: wallet.publicKey.toBase58() },
    { token_weights: WEIGHTS },
  )

  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: weightsTx,
    wallet,
  })

  console.log("Weights set!")
}

main().catch(console.error)
