/**
 * Step 4: Rename a vault (name + symbol). Keeps existing metadata URI.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" \
 *     bun run scripts/mainnet/4-edit-metadata.ts <vault_address> "<New Name>" <NEW_SYMBOL>
 *
 * Example:
 *   bun run scripts/mainnet/4-edit-metadata.ts G54nsr… "NOT INSIDER TRADING" NIT
 */

import { Connection, Keypair } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=7ab8b174-ab40-4c2a-aef7-93a19dbd364c"

const vaultAddress = process.argv[2]
const newName = process.argv[3]
const newSymbol = process.argv[4]

if (!vaultAddress || !newName || !newSymbol) {
  console.error('Usage: bun run scripts/mainnet/4-edit-metadata.ts <vault_address> "<New Name>" <NEW_SYMBOL>')
  process.exit(1)
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
  const keypair = loadKeypair()
  const wallet = createWallet(keypair)
  const connection = new Connection(RPC_URL, "confirmed")

  console.log("Wallet: ", keypair.publicKey.toBase58())
  console.log("Vault:  ", vaultAddress)

  const sdk = new SymmetryCore({ connection, network: "mainnet", priorityFee: 100_000 })

  const vault = await sdk.fetchVault(vaultAddress)
  const meta = vault.formatted!.metadata_settings
  console.log(`Current: "${meta.name}" (${meta.symbol})`)
  console.log(`New:     "${newName}" (${newSymbol})`)
  console.log(`URI:     ${meta.uri}  (preserved)`)
  console.log(`Delay:   ${meta.modification_delay}s  (preserved)`)

  console.log("\nSubmitting editMetadata intent…")
  const tx = await sdk.editMetadataTx(
    { vault: vaultAddress, manager: wallet.publicKey.toBase58() },
    {
      name: newName,
      symbol: newSymbol,
      uri: meta.uri,
      modification_delay: meta.modification_delay,
    },
  )

  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: tx,
    wallet,
  })

  console.log("Done.")
  if (meta.modification_delay > 0) {
    console.log(
      `\nNote: this vault has a ${meta.modification_delay}s modification delay — the rename takes effect after that window.`,
    )
  }
}

main().catch(console.error)
