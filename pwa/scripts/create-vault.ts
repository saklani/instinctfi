/**
 * One-time script to create a "US Top 5 Tech" vault on Symmetry devnet.
 *
 * Uses SOL + devnet USDC as placeholder tokens (xStocks aren't on devnet).
 * Swap mints to real xStocks when deploying to mainnet.
 *
 * Usage:
 *   PRIVATE_KEY=<base58-or-json-array> bun run scripts/create-vault.ts
 */

import { Connection, Keypair } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"
import * as bs58 from "bs58"

// ── Config ──────────────────────────────────────────────
const RPC_URL = "https://api.devnet.solana.com"
const NETWORK = "devnet" as const

// Devnet mints
const WSOL_MINT = "So11111111111111111111111111111111111111112"
const USDC_MINT = "USDCoctVLVnvTXBEuP9s8hntucdJokbo17RwHuNXemT"

// Pyth devnet price feeds
const PYTH_SOL_USD = "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"
const PYTH_USDC_USD = "Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"

// ── Wallet ──────────────────────────────────────────────
function loadKeypair(): Keypair {
  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error("Set PRIVATE_KEY env var (base58 or JSON array)")

  try {
    // Try base58 first
    return Keypair.fromSecretKey(bs58.default.decode(pk))
  } catch {
    // Fall back to JSON array
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(pk)))
  }
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

// ── Oracle config helper ────────────────────────────────
function pythOracle(account: string, decimals: number) {
  return {
    oracle_type: "pyth" as const,
    account_lut_id: 0,
    account_lut_index: 0,
    account,
    weight_bps: 10000,
    is_required: true,
    conf_thresh_bps: 200,
    volatility_thresh_bps: 200,
    max_slippage_bps: 1000,
    min_liquidity: 0,
    staleness_thresh: 120,
    staleness_conf_rate_bps: 50,
    token_decimals: decimals,
    twap_seconds_ago: 0,
    twap_secondary_seconds_ago: 0,
    quote_token: "usd" as const,
    min_conf_bps: 10,
    conf_multiplier: 1.0,
  }
}

// ── Main ────────────────────────────────────────────────
async function main() {
  const keypair = loadKeypair()
  const wallet = createWallet(keypair)
  const connection = new Connection(RPC_URL)

  console.log("Wallet:", keypair.publicKey.toBase58())
  console.log("Network:", NETWORK)

  const sdk = new SymmetryCore({
    connection,
    network: NETWORK,
    priorityFee: 50_000,
  })

  // 1. Create vault
  console.log("\n1. Creating vault...")
  const vaultResult = await sdk.createVaultTx({
    creator: wallet.publicKey.toBase58(),
    start_price: "1.0",
    name: "US Top 5 Tech",
    symbol: "TECH5",
    metadata_uri: "https://arweave.net/placeholder", // TODO: upload real metadata
    host_platform_params: {
      host_pubkey: wallet.publicKey.toBase58(),
      host_deposit_fee_bps: 0,
      host_withdraw_fee_bps: 0,
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
  console.log("Vault created!")
  console.log("  Vault address:", vaultAddress)
  console.log("  Vault mint:", vaultMint)

  // Wait for confirmation
  console.log("  Waiting for confirmation...")
  await new Promise((r) => setTimeout(r, 5000))

  const ctx = {
    vault: vaultAddress,
    manager: wallet.publicKey.toBase58(),
  }

  // 2. Add SOL token
  console.log("\n2. Adding SOL...")
  const addSolTx = await sdk.addOrEditTokenTx(ctx, {
    token_mint: WSOL_MINT,
    active: true,
    min_oracles_thresh: 1,
    min_conf_bps: 10,
    conf_thresh_bps: 200,
    conf_multiplier: 1.0,
    oracles: [pythOracle(PYTH_SOL_USD, 9)],
  })
  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: addSolTx,
    wallet,
  })
  console.log("  SOL added.")

  // 3. Add USDC token
  console.log("\n3. Adding USDC...")
  const addUsdcTx = await sdk.addOrEditTokenTx(ctx, {
    token_mint: USDC_MINT,
    active: true,
    min_oracles_thresh: 1,
    min_conf_bps: 10,
    conf_thresh_bps: 200,
    conf_multiplier: 1.0,
    oracles: [pythOracle(PYTH_USDC_USD, 6)],
  })
  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: addUsdcTx,
    wallet,
  })
  console.log("  USDC added.")

  // 4. Set weights (50/50 for devnet demo)
  console.log("\n4. Setting weights...")
  const weightsTx = await sdk.updateWeightsTx(ctx, {
    token_weights: [
      { mint: WSOL_MINT, weight_bps: 5000 },
      { mint: USDC_MINT, weight_bps: 5000 },
    ],
  })
  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: weightsTx,
    wallet,
  })
  console.log("  Weights set: SOL 50%, USDC 50%")

  // 5. Print summary
  console.log("\n═══════════════════════════════════════")
  console.log("Vault created successfully!")
  console.log("═══════════════════════════════════════")
  console.log("")
  console.log("Add these to your .env:")
  console.log(`VITE_VAULT_ADDRESS=${vaultAddress}`)
  console.log(`VITE_VAULT_MINT=${vaultMint}`)
  console.log("")
  console.log("Next: fund the vault with an initial deposit.")
}

main().catch(console.error)
