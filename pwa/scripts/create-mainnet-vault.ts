/**
 * Create the Pelosi Tracker vault on Solana mainnet.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/mainnet-vault.json)" bun run scripts/create-mainnet-vault.ts
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

// ── Config ──────────────────────────────────────────────
const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=7ab8b174-ab40-4c2a-aef7-93a19dbd364c"
const NETWORK = "mainnet" as const

// ── Tokens from pelosi.csv ──────────────────────────────
const TOKENS = [
  {
    name: "NVIDIA",
    ticker: "NVDAx",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    pyth: "2w1Tg1XTZbUib7srfRoStJ4v5JXVsK7roQEGMsMaGZFC",
    decimals: 8,
    weight_bps: 2200,
  },
  {
    name: "Alphabet",
    ticker: "GOOGLx",
    mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
    pyth: "HShKFQqhYkUiXpVyyLmrAALXwWqHB7ikLmPbrwJzpRNh",
    decimals: 8,
    weight_bps: 1700,
  },
  {
    name: "Amazon",
    ticker: "AMZNx",
    mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
    pyth: "GBkjjFxbaFY9TBHpAPypk5JBchpPPve2jskAcd9zuFNd",
    decimals: 8,
    weight_bps: 1300,
  },
  {
    name: "Apple",
    ticker: "AAPLx",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    pyth: "DJ2FyTgUAkEtXW3U5P9PF19meFTRtW4ZWKKFgACfVbUy",
    decimals: 8,
    weight_bps: 1000,
  },
  {
    name: "Meta",
    ticker: "METAx",
    mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
    pyth: "GsKrMNoa1Mqjpif4SYk2WjdduWZP699hXRdP51yBM6K2",
    decimals: 8,
    weight_bps: 1000,
  },
  {
    name: "Palantir",
    ticker: "PLTRx",
    mint: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4",
    pyth: "7RP45Z6dsTrHQakMg7xha1RLZGk1x2pVViBjpUMpzdBK",
    decimals: 8,
    weight_bps: 1000,
  },
  {
    name: "Microsoft",
    ticker: "MSFTx",
    mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
    pyth: "7VYuuJxz8w2rLA9tJG2KZ9T1fSMcjC7uECoYA6nDaqtK",
    decimals: 8,
    weight_bps: 1000,
  },
  {
    name: "Tesla",
    ticker: "TSLAx",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    pyth: "E8WFH8brgP58arcuW2wwsPHiomYrSvrgWTsRLZLAEZUQ",
    decimals: 8,
    weight_bps: 800,
  },
]

// Verify weights sum to 10000
const totalWeight = TOKENS.reduce((sum, t) => sum + t.weight_bps, 0)
if (totalWeight !== 10000) {
  throw new Error(`Weights sum to ${totalWeight}, expected 10000`)
}

// ── Wallet ──────────────────────────────────────────────
function loadKeypair(): Keypair {
  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error("Set PRIVATE_KEY env var (JSON array from keypair file)")
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
    conf_thresh_bps: 10000,
    volatility_thresh_bps: 10000,
    max_slippage_bps: 1000,
    min_liquidity: 0,
    staleness_thresh: 86400,
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
  const connection = new Connection(RPC_URL, "confirmed")

  const balance = await connection.getBalance(keypair.publicKey)
  console.log("Wallet:", keypair.publicKey.toBase58())
  console.log("Balance:", balance / LAMPORTS_PER_SOL, "SOL")
  console.log("Network:", NETWORK)
  console.log()

  if (balance < 0.05 * LAMPORTS_PER_SOL) {
    throw new Error("Need at least 0.05 SOL for transaction fees")
  }

  const sdk = new SymmetryCore({
    connection,
    network: NETWORK,
    priorityFee: 100_000,
  })

  // ── Step 1: Create vault ──────────────────────────────
  console.log("1. Creating vault: Pelosi Tracker (PELO)...")
  const vaultResult = await sdk.createVaultTx({
    creator: wallet.publicKey.toBase58(),
    start_price: "1.0",
    name: "Pelosi Tracker",
    symbol: "PELO",
    metadata_uri: "https://arweave.net/placeholder", // TODO: upload real metadata
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
  console.log("   Vault:", vaultAddress)
  console.log("   Mint:", vaultMint)

  // Wait for confirmation
  console.log("   Waiting for confirmation...")
  await new Promise((r) => setTimeout(r, 5000))

  const ctx = {
    vault: vaultAddress,
    manager: wallet.publicKey.toBase58(),
  }

  // ── Step 2: Add tokens ────────────────────────────────
  for (const token of TOKENS) {
    console.log(`\n2. Adding ${token.name} (${token.ticker})...`)
    try {
      const addTx = await sdk.addOrEditTokenTx(ctx, {
        token_mint: token.mint,
        active: true,
        min_oracles_thresh: 1,
        min_conf_bps: 10,
        conf_thresh_bps: 200,
        conf_multiplier: 1.0,
        oracles: [pythOracle(token.pyth, token.decimals)],
      })
      await sdk.signAndSendTxPayloadBatchSequence({
        txPayloadBatchSequence: addTx,
        wallet,
      })
      console.log(`   ${token.ticker} added.`)
    } catch (e: any) {
      console.error(`   ERROR adding ${token.ticker}:`, e.message)
    }
    // Small delay between transactions
    await new Promise((r) => setTimeout(r, 2000))
  }

  // ── Step 3: Set weights ───────────────────────────────
  console.log("\n3. Setting weights...")
  const weightsTx = await sdk.updateWeightsTx(ctx, {
    token_weights: TOKENS.map((t) => ({
      mint: t.mint,
      weight_bps: t.weight_bps,
    })),
  })
  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: weightsTx,
    wallet,
  })
  console.log("   Weights set.")

  // ── Summary ───────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════")
  console.log("Pelosi Tracker vault created on mainnet!")
  console.log("═══════════════════════════════════════════════")
  console.log()
  console.log("Add to .env:")
  console.log(`VITE_VAULT_ADDRESS=${vaultAddress}`)
  console.log(`VITE_VAULT_MINT=${vaultMint}`)
  console.log()
  console.log("Composition:")
  for (const t of TOKENS) {
    console.log(`  ${t.ticker.padEnd(8)} ${(t.weight_bps / 100).toFixed(0).padStart(3)}%  ${t.mint}`)
  }
  console.log()
  console.log("Fees: 0% deposit, 0.5% withdraw")
  console.log()
  console.log("Next: seed the vault with an initial deposit.")
}

main().catch(console.error)
