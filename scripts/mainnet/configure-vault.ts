/**
 * One-shot vault configurator. Reads a target composition CSV, then:
 *   1. Pushes any missing/stale Pyth oracles for tokens not yet active.
 *   2. Adds those tokens to the vault (with correct decimals from the CSV).
 *   3. Refreshes Pyth for every active token that has a non-zero target weight.
 *   4. Submits an updateWeights tx covering every active mint (zeros for ones not in the CSV).
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" \
 *     bun run scripts/mainnet/configure-vault.ts <vault_address> <weights_csv>
 *
 * Reuses scripts/push-pyth-price.ts logic inline (it's small) so we can call it
 * programmatically with timing control rather than via shell.
 */

import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver"
import { HermesClient } from "@pythnetwork/hermes-client"
import { Wallet } from "@coral-xyz/anchor"

const RPC_URL =
  "https://mainnet.helius-rpc.com/?api-key=7ab8b174-ab40-4c2a-aef7-93a19dbd364c"

const STALENESS_THRESHOLD_S = 60 // refresh if older than 60s; SDK threshold is 120s

interface CsvRow {
  ticker: string
  mint: string
  pyth: string
  decimals: number
  weightBps: number
}

// ── CLI ────────────────────────────────────────────────────────────

const vaultAddress = process.argv[2]
const csvPath = process.argv[3]
if (!vaultAddress || !csvPath) {
  console.error(
    "Usage: bun run scripts/mainnet/configure-vault.ts <vault_address> <weights_csv>",
  )
  process.exit(1)
}

// ── Wallet helpers ─────────────────────────────────────────────────

function loadKeypair(): Keypair {
  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error("Set PRIVATE_KEY env var")
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(pk)))
}

function symmetryWallet(kp: Keypair) {
  return {
    publicKey: kp.publicKey,
    signTransaction: async <T>(tx: T): Promise<T> => {
      ;(tx as any).sign([kp])
      return tx
    },
    signAllTransactions: async <T>(txs: T[]): Promise<T[]> => {
      txs.forEach((t: any) => t.sign([kp]))
      return txs
    },
    payer: kp,
  }
}

// ── CSV parsing ────────────────────────────────────────────────────

async function loadCsv(path: string): Promise<CsvRow[]> {
  const text = await Bun.file(path).text()
  const lines = text.trim().split("\n").slice(1) // skip header
  return lines.map((line) => {
    const [, ticker, mint, pyth, decimals, weight] = line.split(",")
    return {
      ticker,
      mint,
      pyth,
      decimals: Number(decimals),
      weightBps: Number(weight),
    }
  })
}

// ── Pyth helpers ───────────────────────────────────────────────────

const FEED_ID_BY_PYTH_ACCOUNT: Record<string, string> = {
  // Known mappings; if a CSV references a Pyth account not here, it must
  // already be on-chain (we won't be able to push for it).
  "2w1Tg1XTZbUib7srfRoStJ4v5JXVsK7roQEGMsMaGZFC":
    "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593", // NVDA
  HShKFQqhYkUiXpVyyLmrAALXwWqHB7ikLmPbrwJzpRNh:
    "5a48c03e9b9cb337801073ed9d166817473697efff0d138874e0f6a33d6d5aa6", // GOOGL
  GBkjjFxbaFY9TBHpAPypk5JBchpPPve2jskAcd9zuFNd:
    "b5d0e0fa58a1f8b81498ae670ce93c872d14434b72c364885d4fa1b257cbb07a", // AMZN
  DJ2FyTgUAkEtXW3U5P9PF19meFTRtW4ZWKKFgACfVbUy:
    "49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688", // AAPL
  GsKrMNoa1Mqjpif4SYk2WjdduWZP699hXRdP51yBM6K2:
    "78a3e3b8e676a8f73c439f5d749737034b139bbbe899ba5775216fba596607fe", // META
  "7VYuuJxz8w2rLA9tJG2KZ9T1fSMcjC7uECoYA6nDaqtK":
    "d0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1", // MSFT
  E8WFH8brgP58arcuW2wwsPHiomYrSvrgWTsRLZLAEZUQ:
    "16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1", // TSLA
  "7RP45Z6dsTrHQakMg7xha1RLZGk1x2pVViBjpUMpzdBK":
    "11a70634863ddffb71f2b11f2cff29f73f3db8f6d0b78c49f2b5f4ad36e885f0", // PLTR
  "5tZizzQN776ZWTibPJKecjk1DkTSDHu47dXM3SxR5D5i":
    "306736a4035846ba15a3496eed57225b64cc19230a50d14f3ed20fd7219b7849", // HOOD
  "91JXaWGHr57awfqhXQP2TxrkLX6CpvtBaaRjz1PEQqXn":
    "fee33f2a978bf32dd6b662b65ba8083c6773b494f8401194ec1870c640860245", // COIN
  "7zWGncBP5aGTDmEK7Ej4GYwGc2kXFHZJZFxmq28ocCaG":
    "92b8527aabe59ea2b12230f7b532769b133ffb118dfbd48ff676f14b273f1365", // CRCL
  HJGvGyWrAXdZPG4Q7LNkkKja72FDkJW7ixuyg3u6vZyP:
    "e1e80251e5f5184f2195008382538e847fafc36f751896889dd3d1b1f6111f09", // MSTR
  GcEfvXPFyoWLfZeKCoA2gRwLCQds49anRfVzVRcU9cai:
    "27c7bbc9755d847f7fc63620c2edcc6a91d2c0c67a28c7999907b59c505b3c17", // STRC
  // New feeds from current session
  "2jgfs5FsDQkdCrgcCKHEd7p9KNtKAyWznMSyu21WbFgS":
    "d0c9aef79b28308b256db7742a0a9b08aaa5009db67a52ea7fa30ed6853f243b", // AVGO
  "8zWQVp313FFdanpZoQeDohp5HE7ugoJE2VaX4sYPHj4e":
    "baed936d3c6c2e34104e92c6b015b97ce96adc5ab4f04230c1270e1162e7a270", // CRWD
  EHEfCJoRUewTW91Lv2k33eLW72JkbxbVH6YsisTskg1n:
    "67e031d1723e5c89e4a826d80b2f3b41a91b05ef6122d523b8829a02e0f563aa", // GLXY
  "6KyngSTLXWMNfdNqypV386z34KShV2er8RVYqx8naE1D":
    "d9d22050e7413a16129f1334cd4dd5a359975ce16389cdadae8f677cf46e2839", // BIO
  BxizdE1Rd9yeCXUaorGNGLc4qHbqBULxiBtjRX37HjSV:
    "2551eca7784671173def2c41e6f3e51e11cd87494863f1d208fdd8c64a1f85ae", // AI16Z
  H2tjxYMHGVN9F8S7ewVaECDZtRpVxgfrtAMEGtRDvqYe:
    "40589e289317e4fbd997b1a267606e20a1cc7c3e4689f9e5a5992957917816c8", // RKLB
  HBCUey2zP688M1XcH5CXj5sr7P9YqNDb6ERTnjDziKLW:
    "05380f8817eb1316c0b35ac19c3caa92c9aa9ea6be1555986c46dce97fed6afd", // UNH
  "8fnWtZJsXpe8T6xRxb5qNLWrMYGQxphw4mMyPtAkPmq6":
    "2132cbc333161e94b91da745ed73b1450410fdc870f2235bf628c28da358b652", // HIMS
  CmuiU9H1WmLZrPnfJLZ4DuktUJwDU3mpKFosnihAWbTn:
    "ac9de86ae3dcff03514bde733f5793f1446b2cd31f1539a1c449acc3e76cacc1", // VRTX
  "2hxcaArrSKpNsUmeGr7dsDHsuYxUcxRpCWkiCfStp3Du":
    "1feb5bc35d3a601d1e39c4d1dd65de285a04f5e7923fdaba1d87359d8c14a9ae", // VNQ
  AmhgzXb37V3YegqdXoDTGL5QVhSV83dESyadboJwc7sQ:
    "70dcf5fd56553d0023693e4b590336a8c9bcfd0d98dd9f093b1f697820d98325", // LLY
  "96q5heUgagmBhXZLBYCk3dvbhoPewy7tLbdVsJvp1Jq":
    "8dde322496e031d942b9eee8ca769d618cd2e69b18196644369379f5a1e7c23d", // NVO
  "5f9eekiFMRESBFgdCS7CPaJGtt6kZAPsMtaFraeGjDRD":
    "244fdf268ed7ecfad2cf84529c46d0fcef7a643428ff4ef8b16e8dbb63e0f2d9", // TMO
  "54f3QWxFrEDByLpuen8k9qaSTYiCRcAcpzWcH6pbZ7Ht":
    "725ae6c67201359f9601d6ee8228c821f0abc93fef5cc509acfcee3f7bc2a388", // DHR
}

async function pythAge(conn: Connection, pyth: string): Promise<number | null> {
  try {
    const info = await conn.getAccountInfo(new PublicKey(pyth))
    if (!info) return null
    // PriceUpdateV2 layout: 8(disc) + 32(authority) + 1(vlevel) + 32(feed) + 8(price) + 8(conf) + 4(exponent) + 8(publish_time)…
    const offset = 8 + 32 + 1 + 32 + 8 + 8 + 4
    if (info.data.length < offset + 8) return null // unknown layout, force a push
    const publishTime = Number(info.data.readBigInt64LE(offset))
    return Math.floor(Date.now() / 1000) - publishTime
  } catch {
    return null
  }
}

async function pushIfStale(
  hermes: HermesClient,
  pythReceiver: PythSolanaReceiver,
  conn: Connection,
  pyth: string,
  label: string,
): Promise<void> {
  const age = await pythAge(conn, pyth)
  if (age !== null && age < STALENESS_THRESHOLD_S) {
    console.log(`  [pyth] ${label} fresh (${age}s old)`)
    return
  }
  const feedId = FEED_ID_BY_PYTH_ACCOUNT[pyth]
  if (!feedId) {
    throw new Error(
      `No known feed_id for Pyth account ${pyth} (${label}). Add it to FEED_ID_BY_PYTH_ACCOUNT.`,
    )
  }
  console.log(
    `  [pyth] ${label} ${age === null ? "missing" : `stale (${age}s)`} — pushing…`,
  )
  const updates = await hermes.getLatestPriceUpdates([feedId], {
    encoding: "base64",
  })
  if (!updates?.binary?.data?.length) {
    throw new Error(`No price data from Hermes for ${label}`)
  }
  const builder = pythReceiver.newTransactionBuilder({
    closeUpdateAccounts: true,
  })
  await builder.addUpdatePriceFeed(updates.binary.data, 0)
  const txs = await builder.buildVersionedTransactions({
    tightComputeBudget: true,
  })
  await pythReceiver.provider.sendAll(txs, { preflightCommitment: "confirmed" })
  console.log(`  [pyth] ${label} pushed`)
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const kp = loadKeypair()
  const wallet = symmetryWallet(kp)
  const conn = new Connection(RPC_URL, "confirmed")
  const sdk = new SymmetryCore({
    connection: conn,
    network: "mainnet",
    priorityFee: 100_000,
  })
  const hermes = new HermesClient("https://hermes.pyth.network")
  const pythReceiver = new PythSolanaReceiver({
    connection: conn,
    wallet: new Wallet(kp),
  })

  console.log("Wallet:", kp.publicKey.toBase58())
  const balLamports = await conn.getBalance(kp.publicKey)
  console.log("Balance:", (balLamports / 1e9).toFixed(4), "SOL\n")

  console.log("Vault:", vaultAddress)
  console.log("CSV:  ", csvPath)

  const target = await loadCsv(csvPath)
  const totalBps = target.reduce((s, r) => s + r.weightBps, 0)
  console.log(
    `Target: ${target.length} tokens, ${totalBps} bps (must be 10000)\n`,
  )
  if (totalBps !== 10000) throw new Error("Weights must sum to 10000")

  const vault = await sdk.fetchVault(vaultAddress)
  console.log(`Vault name:    ${vault.formatted!.name}`)
  console.log(`Active tokens: ${vault.composition.filter((a) => a.active).length}\n`)

  const activeMints = new Set(
    vault.composition
      .filter((a) => a.active)
      .map((a) => a.mint.toBase58()),
  )
  const targetMints = new Set(target.map((r) => r.mint))

  // ── 1. Add missing tokens ─────────────────────────────────────────
  const toAdd = target.filter((r) => !activeMints.has(r.mint))
  console.log(`Adding ${toAdd.length} new token(s)...\n`)
  for (const t of toAdd) {
    console.log(`▶ ${t.ticker} (${t.mint})`)
    await pushIfStale(hermes, pythReceiver, conn, t.pyth, t.ticker)
    const tx = await sdk.addOrEditTokenTx(
      { vault: vaultAddress, manager: kp.publicKey.toBase58() },
      {
        token_mint: t.mint,
        active: true,
        min_oracles_thresh: 1,
        min_conf_bps: 10,
        conf_thresh_bps: 200,
        conf_multiplier: 1.0,
        oracles: [
          {
            oracle_type: "pyth" as const,
            account_lut_id: 0,
            account_lut_index: 0,
            account: t.pyth,
            weight_bps: 10000,
            is_required: true,
            conf_thresh_bps: 200,
            volatility_thresh_bps: 200,
            max_slippage_bps: 1000,
            min_liquidity: 0,
            staleness_thresh: 120,
            staleness_conf_rate_bps: 50,
            token_decimals: t.decimals,
            twap_seconds_ago: 0,
            twap_secondary_seconds_ago: 0,
            quote_token: "usd" as const,
            min_conf_bps: 10,
            conf_multiplier: 1.0,
          },
        ],
      },
    )
    await sdk.signAndSendTxPayloadBatchSequence({
      txPayloadBatchSequence: tx,
      wallet,
    })
    console.log(`  ✓ ${t.ticker} added`)
  }

  // ── 2. Refresh oracles for everything that will have non-zero weight ──
  console.log("\nRefreshing oracles for non-zero target weights…")
  // Build mint→pyth map: from CSV for known mints, plus refetch vault for current oracles
  const refreshed = await sdk.fetchVault(vaultAddress)
  const oracleByMint = new Map<string, string>()
  for (const a of refreshed.formatted!.composition) {
    if (!a.active) continue
    const pythAccount = a.oracle_aggregator.oracles[0].oracle_settings.account
    oracleByMint.set(a.mint, pythAccount)
  }
  for (const t of target) {
    if (t.weightBps === 0) continue
    const pyth = oracleByMint.get(t.mint) ?? t.pyth
    await pushIfStale(hermes, pythReceiver, conn, pyth, t.ticker)
  }

  // ── 3. Build the full weights list (every active mint) ──────────
  const allWeights: { mint: string; weight_bps: number }[] = []
  for (const a of refreshed.formatted!.composition) {
    if (!a.active) continue
    const targetRow = target.find((r) => r.mint === a.mint)
    allWeights.push({ mint: a.mint, weight_bps: targetRow?.weightBps ?? 0 })
  }
  const sumAll = allWeights.reduce((s, w) => s + w.weight_bps, 0)
  console.log(
    `\nWeights: ${allWeights.length} mints, total ${sumAll} bps (must be 10000)`,
  )
  if (sumAll !== 10000) throw new Error("Active-mint weight sum != 10000")

  // ── 4. Submit set-weights ───────────────────────────────────────
  console.log("\nSetting weights…")
  const weightsTx = await sdk.updateWeightsTx(
    { vault: vaultAddress, manager: kp.publicKey.toBase58() },
    { token_weights: allWeights },
  )
  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: weightsTx,
    wallet,
  })

  // ── 5. Verify ───────────────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 4000))
  const final = await sdk.fetchVault(vaultAddress)
  console.log("\nFinal composition:")
  for (const a of final.formatted!.composition) {
    if (!a.active) continue
    const ticker =
      target.find((r) => r.mint === a.mint)?.ticker ??
      a.mint.slice(0, 8) + "…"
    console.log(
      `  ${ticker.padEnd(10)} ${(a.weight / 100).toFixed(2).padStart(6)}%   ${a.mint}`,
    )
  }
  const finalSum = final.formatted!.composition
    .filter((a) => a.active)
    .reduce((s, a) => s + a.weight, 0)
  console.log(`Sum: ${finalSum} bps (should be 10000)`)
  void targetMints // type-checker satisfaction
}

main().catch((e) => {
  console.error("\n✗ Failed:", e?.message ?? e)
  process.exit(1)
})
