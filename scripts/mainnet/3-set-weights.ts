/**
 * Step 3: Set token weights from a CSV
 *
 * CSV format (vaults/<name>.csv):
 *   Token,Ticker,Mint,Pyth_Account,Decimals,Weight_BPS
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" \
 *     bun run scripts/mainnet/3-set-weights.ts <vault_address> <csv_path>
 */

import { Connection, Keypair } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=7ab8b174-ab40-4c2a-aef7-93a19dbd364c"

const vaultAddress = process.argv[2]
const csvPath = process.argv[3]
if (!vaultAddress || !csvPath) {
  console.error("Usage: bun run scripts/mainnet/3-set-weights.ts <vault_address> <csv_path>")
  process.exit(1)
}

async function loadWeights(path: string) {
  const text = await Bun.file(path).text()
  const lines = text.trim().split("\n").slice(1) // skip header
  return lines.map((line) => {
    const cols = line.split(",")
    return { mint: cols[2], weight_bps: Number(cols[5]) }
  })
}

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
  const weights = await loadWeights(csvPath)
  const total = weights.reduce((s, w) => s + w.weight_bps, 0)
  if (total !== 10000) {
    throw new Error(`Weights sum to ${total}, expected 10000`)
  }

  const keypair = loadKeypair()
  const wallet = createWallet(keypair)
  const connection = new Connection(RPC_URL, "confirmed")

  console.log("Wallet:", keypair.publicKey.toBase58())
  console.log("Vault: ", vaultAddress)
  console.log("CSV:   ", csvPath)
  console.log("Weights:", weights.map((w) => `${w.mint.slice(0, 6)}…=${w.weight_bps / 100}%`).join(", "))

  const sdk = new SymmetryCore({ connection, network: "mainnet", priorityFee: 100_000 })

  const vault = await sdk.fetchVault(vaultAddress)
  console.log("Vault name:  ", vault.formatted?.name)
  console.log("Active tokens:", vault.formatted?.composition.filter((a: any) => a.active).length)

  console.log("\nSetting weights...")
  const weightsTx = await sdk.updateWeightsTx(
    { vault: vaultAddress, manager: wallet.publicKey.toBase58() },
    { token_weights: weights },
  )

  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: weightsTx,
    wallet,
  })

  console.log("Weights set!")
}

main().catch(console.error)
