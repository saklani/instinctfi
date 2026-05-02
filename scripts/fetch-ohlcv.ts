/**
 * Fetch historical OHLCV from Pyth Benchmarks and write per-token + vault NAV CSVs.
 *
 * Usage:
 *   bun run scripts/fetch-ohlcv.ts              # default 1M daily
 *   bun run scripts/fetch-ohlcv.ts 7 60         # 7 days, 60-min candles
 *   bun run scripts/fetch-ohlcv.ts 30 D         # 30 days, daily candles
 */

const BENCHMARKS = "https://benchmarks.pyth.network/v1/shims/tradingview/history"
const OUT_DIR = "assets/data"

// ── Token registry ──────────────────────────────────────────────────

interface Token {
  ticker: string        // e.g. "NVDAx"
  pythSymbol: string    // e.g. "Equity.US.NVDA/USD"
}

const TOKENS: Token[] = [
  // Pelosi
  { ticker: "NVDAx",  pythSymbol: "Equity.US.NVDA/USD" },
  { ticker: "GOOGLx", pythSymbol: "Equity.US.GOOGL/USD" },
  { ticker: "AMZNx",  pythSymbol: "Equity.US.AMZN/USD" },
  { ticker: "AAPLx",  pythSymbol: "Equity.US.AAPL/USD" },
  { ticker: "MSFTx",  pythSymbol: "Equity.US.MSFT/USD" },
  // AFFC
  { ticker: "HOODx",  pythSymbol: "Equity.US.HOOD/USD" },
  { ticker: "COINx",  pythSymbol: "Equity.US.COIN/USD" },
  { ticker: "CRCLx",  pythSymbol: "Equity.US.CRCL/USD" },
  { ticker: "MSTRx",  pythSymbol: "Equity.US.MSTR/USD" },
  { ticker: "STRCx",  pythSymbol: "Equity.US.STRC/USD" },
]

// ── Vault compositions ─────────────────────────────────────────────

interface Vault {
  name: string
  prefix: string                   // filename prefix
  weights: Record<string, number>  // ticker → bps
}

const VAULTS: Vault[] = [
  {
    name: "Pelosi Tracker",
    prefix: "PELO_NAV",
    weights: {
      NVDAx: 3400,
      GOOGLx: 2600,
      AMZNx: 2000,
      AAPLx: 1000,
      MSFTx: 1000,
    },
  },
  {
    name: "Anti Finance Finance Club",
    prefix: "AFFC_NAV",
    weights: {
      HOODx: 2600,
      COINx: 2600,
      CRCLx: 2100,
      MSTRx: 2100,
      STRCx: 600,
    },
  },
]

// ── Pyth Benchmarks fetch ───────────────────────────────────────────

interface OHLCVRow {
  ts: number
  date: string
  open: number
  high: number
  low: number
  close: number
}

async function fetchOHLCV(
  pythSymbol: string,
  from: number,
  to: number,
  resolution: string,
): Promise<OHLCVRow[]> {
  const url = `${BENCHMARKS}?symbol=${encodeURIComponent(pythSymbol)}&resolution=${resolution}&from=${from}&to=${to}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${pythSymbol}: HTTP ${res.status}`)
  const json = (await res.json()) as {
    s: string
    t: number[]
    o: number[]
    h: number[]
    l: number[]
    c: number[]
  }
  if (json.s !== "ok" || !json.t?.length) return []
  return json.t.map((ts, i) => ({
    ts,
    date: new Date(ts * 1000).toISOString().slice(0, 10),
    open: json.o[i],
    high: json.h[i],
    low: json.l[i],
    close: json.c[i],
  }))
}

// ── CSV helpers ─────────────────────────────────────────────────────

function tokenCsv(rows: OHLCVRow[]): string {
  const lines = ["date,open,high,low,close"]
  for (const r of rows) {
    lines.push(`${r.date},${r.open},${r.high},${r.low},${r.close}`)
  }
  return lines.join("\n") + "\n"
}

function navCsv(series: { date: string; nav: number }[]): string {
  const lines = ["date,nav"]
  for (const s of series) {
    lines.push(`${s.date},${s.nav.toFixed(4)}`)
  }
  return lines.join("\n") + "\n"
}

function dateTag(from: number, to: number): string {
  const f = new Date(from * 1000).toISOString().slice(0, 10)
  const t = new Date(to * 1000).toISOString().slice(0, 10)
  return `${f}_${t}`
}

// ── NAV computation ─────────────────────────────────────────────────

function computeNav(
  vault: Vault,
  allData: Map<string, OHLCVRow[]>,
): { date: string; nav: number }[] {
  const tickers = Object.keys(vault.weights)

  // Collect all dates present in every constituent
  const dateSets = tickers.map((t) => new Set((allData.get(t) ?? []).map((r) => r.date)))
  const commonDates = [...dateSets[0]].filter((d) => dateSets.every((s) => s.has(d))).sort()

  // Build lookup: ticker → date → close
  const lookup = new Map<string, Map<string, number>>()
  for (const ticker of tickers) {
    const m = new Map<string, number>()
    for (const row of allData.get(ticker) ?? []) m.set(row.date, row.close)
    lookup.set(ticker, m)
  }

  return commonDates.map((date) => {
    let nav = 0
    for (const [ticker, bps] of Object.entries(vault.weights)) {
      const price = lookup.get(ticker)?.get(date) ?? 0
      nav += (bps / 10_000) * price
    }
    return { date, nav }
  })
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const days = Number(process.argv[2] || 30)
  const resolution = process.argv[3] || "D"

  const to = Math.floor(Date.now() / 1000)
  const from = to - days * 86_400
  const tag = dateTag(from, to)

  console.log(`Fetching ${days}d of ${resolution}-resolution data …\n`)

  // Ensure output dir
  await Bun.write(`${OUT_DIR}/.gitkeep`, "")

  // Fetch all tokens in parallel
  const allData = new Map<string, OHLCVRow[]>()

  const results = await Promise.allSettled(
    TOKENS.map(async (token) => {
      const rows = await fetchOHLCV(token.pythSymbol, from, to, resolution)
      allData.set(token.ticker, rows)
      return { token, rows }
    }),
  )

  // Write per-token CSVs
  for (const r of results) {
    if (r.status === "rejected") {
      console.error(`  ✗ ${r.reason}`)
      continue
    }
    const { token, rows } = r.value
    if (!rows.length) {
      console.log(`  – ${token.ticker}: no data`)
      continue
    }
    const path = `${OUT_DIR}/${token.ticker}_${tag}.csv`
    await Bun.write(path, tokenCsv(rows))
    console.log(`  ✓ ${token.ticker}: ${rows.length} rows → ${path}`)
  }

  // Compute and write vault NAV CSVs
  console.log()
  for (const vault of VAULTS) {
    const series = computeNav(vault, allData)
    if (!series.length) {
      console.log(`  – ${vault.name}: no common dates`)
      continue
    }
    const path = `${OUT_DIR}/${vault.prefix}_${tag}.csv`
    await Bun.write(path, navCsv(series))
    console.log(`  ✓ ${vault.name}: ${series.length} rows → ${path}`)
  }

  console.log("\nDone.")
}

main().catch(console.error)
