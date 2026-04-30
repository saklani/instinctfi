/**
 * Add tokens and set weights on an existing vault.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/setup-vault.ts
 */

import { Connection, Keypair } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = "https://api.devnet.solana.com"
const NETWORK = "devnet" as const

// The vault we just created
const VAULT_ADDRESS = "EeDideZqgCwCuQFd4241ZsZRVBcSgVYf1rPStqzov9qc"
const VAULT_MINT = "FwW1GEyvCx7q96wm4AYEGEUSFnNYozjxPwBaXWmcJeh7"

const WSOL_MINT = "So11111111111111111111111111111111111111112"
const USDC_MINT = "USDCoctVLVnvTXBEuP9s8hntucdJokbo17RwHuNXemT"

const PYTH_SOL_USD = "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"
const PYTH_USDC_USD = "Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"

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

async function main() {
  const keypair = loadKeypair()
  const wallet = createWallet(keypair)
  const connection = new Connection(RPC_URL)

  console.log("Wallet:", keypair.publicKey.toBase58())
  console.log("Vault:", VAULT_ADDRESS)

  const sdk = new SymmetryCore({
    connection,
    network: NETWORK,
    priorityFee: 50_000,
  })

  const ctx = {
    vault: VAULT_ADDRESS,
    manager: wallet.publicKey.toBase58(),
  }

  // 1. Verify vault exists
  console.log("\nFetching vault...")
  const vault = await sdk.fetchVault(VAULT_ADDRESS)
  console.log("  Found:", vault.formatted?.name ?? "unnamed")

  // 2. Add SOL
  console.log("\nAdding SOL...")
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
  console.log("  Done.")

  // 3. Add USDC
  console.log("\nAdding USDC...")
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
  console.log("  Done.")

  // 4. Set weights
  console.log("\nSetting weights (50/50)...")
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
  console.log("  Done.")

  console.log("\n═══════════════════════════════════════")
  console.log("Vault setup complete!")
  console.log(`VITE_VAULT_ADDRESS=${VAULT_ADDRESS}`)
  console.log(`VITE_VAULT_MINT=${VAULT_MINT}`)
  console.log("═══════════════════════════════════════")
}

main().catch(console.error)
