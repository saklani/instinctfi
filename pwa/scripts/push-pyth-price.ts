/**
 * Push a Pyth price update to Solana, creating the price feed account if it doesn't exist.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/push-pyth-price.ts <feed_id_hex>
 *
 * Example (META):
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/push-pyth-price.ts 78a3e3b8e676a8f73c439f5d749737034b139bbbe899ba5775216fba596607fe
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver"
import { HermesClient } from "@pythnetwork/hermes-client"
import { Wallet } from "@coral-xyz/anchor"

const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=7ab8b174-ab40-4c2a-aef7-93a19dbd364c"

const feedId = process.argv[2]
if (!feedId) {
  console.error("Usage: bun run scripts/push-pyth-price.ts <feed_id_hex>")
  console.error("")
  console.error("Feed IDs:")
  console.error("  META:  78a3e3b8e676a8f73c439f5d749737034b139bbbe899ba5775216fba596607fe")
  console.error("  PLTR:  11a70634863ddffb71f2b11f2cff29f73f3db8f6d0b78c49f2b5f4ad36e885f0")
  process.exit(1)
}

function loadKeypair(): Keypair {
  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error("Set PRIVATE_KEY env var")
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(pk)))
}

async function main() {
  const keypair = loadKeypair()
  const connection = new Connection(RPC_URL, "confirmed")
  const wallet = new Wallet(keypair)

  console.log("Wallet:", keypair.publicKey.toBase58())
  console.log("Balance:", (await connection.getBalance(keypair.publicKey)) / LAMPORTS_PER_SOL, "SOL")
  console.log("Feed ID:", feedId)
  console.log()

  // Fetch price update from Hermes
  console.log("Fetching price from Hermes...")
  const hermes = new HermesClient("https://hermes.pyth.network")
  const priceUpdates = await hermes.getLatestPriceUpdates([feedId], { encoding: "base64" })

  if (!priceUpdates?.binary?.data?.length) {
    console.error("No price data returned from Hermes")
    process.exit(1)
  }

  console.log("Got price update VAA")

  // Post to Solana using addUpdatePriceFeed (creates/updates the price feed account)
  console.log("Posting to Solana (shard 0)...")
  const pythReceiver = new PythSolanaReceiver({
    connection,
    wallet,
  })

  const transactionBuilder = pythReceiver.newTransactionBuilder({
    closeUpdateAccounts: true,
  })

  // addUpdatePriceFeed creates the on-chain price feed account PDA
  await transactionBuilder.addUpdatePriceFeed(priceUpdates.binary.data, 0)

  const txs = await pythReceiver.provider.sendAll(
    await transactionBuilder.buildVersionedTransactions({
      tightComputeBudget: true,
    }),
    { preflightCommitment: "confirmed" }
  )

  console.log("Transactions sent:", txs.length)
  for (const tx of txs) {
    console.log("  ", tx)
  }

  console.log("\nPrice feed account created/updated!")
}

main().catch(console.error)
