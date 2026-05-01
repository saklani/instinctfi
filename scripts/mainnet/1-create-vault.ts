/**
 * Step 1: Create the vault
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/mainnet/1-create-vault.ts
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=7ab8b174-ab40-4c2a-aef7-93a19dbd364c"

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
  console.log("Balance:", (await connection.getBalance(keypair.publicKey)) / LAMPORTS_PER_SOL, "SOL")

  const sdk = new SymmetryCore({ connection, network: "mainnet", priorityFee: 100_000 })

  console.log("\nCreating vault: Anti Finance Finance Club (AFFC)...")
  const vaultResult = await sdk.createVaultTx({
    creator: wallet.publicKey.toBase58(),
    start_price: "1.0",
    name: "Anti Finance Finance Club",
    symbol: "AFFC",
    metadata_uri: "https://arweave.net/placeholder",
    host_platform_params: {
      host_pubkey: wallet.publicKey.toBase58(),
      host_deposit_fee_bps: 0,
      host_withdraw_fee_bps: 50,
      host_management_fee_bps: 0,
      host_performance_fee_bps: 0,
    },
  })

  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: vaultResult,
    wallet,
  })

  const vaultAddress = (vaultResult as any).vault
  const vaultMint = (vaultResult as any).mint

  console.log("\n=== VAULT CREATED ===")
  console.log("Vault:", vaultAddress)
  console.log("Mint:", vaultMint)
  console.log("\nSave these and use in the next steps.")
}

main().catch(console.error)
