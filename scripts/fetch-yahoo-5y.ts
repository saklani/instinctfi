/**
 * One-off: pull 5 years of daily closes from Yahoo Finance for every equity in
 * our vaults and write them as `assets/data/{TICKER}_{from}_{to}.csv` so the
 * existing `import-stock-prices.ts` picks the longest file per ticker.
 *
 * Yahoo's chart endpoint returns whatever it has — newer listings just give
 * shorter series. Pyth-only tokens (BIO, SOL, USDC) are skipped here.
 *
 * Usage:
 *   bun run scripts/fetch-yahoo-5y.ts
 */

const OUT_DIR = "assets/data"
const YEARS = 5

interface Token {
  ticker: string  // wrapper ticker we store under (NVDAx, AVGOon, …)
  yahoo: string   // raw equity symbol on Yahoo (NVDA, AVGO, …)
}

const TOKENS: Token[] = [
  // xStocks
  { ticker: "NVDAx",  yahoo: "NVDA" },
  { ticker: "GOOGLx", yahoo: "GOOGL" },
  { ticker: "AMZNx",  yahoo: "AMZN" },
  { ticker: "AAPLx",  yahoo: "AAPL" },
  { ticker: "MSFTx",  yahoo: "MSFT" },
  { ticker: "HOODx",  yahoo: "HOOD" },
  { ticker: "COINx",  yahoo: "COIN" },
  { ticker: "CRCLx",  yahoo: "CRCL" },
  { ticker: "MSTRx",  yahoo: "MSTR" },
  { ticker: "STRCx",  yahoo: "STRC" },
  { ticker: "LLYx",   yahoo: "LLY" },
  { ticker: "NVOx",   yahoo: "NVO" },
  { ticker: "TMOx",   yahoo: "TMO" },
  { ticker: "DHRx",   yahoo: "DHR" },
  { ticker: "GLXYx",  yahoo: "GLXY" },
  // Ondo (use the underlying equity)
  { ticker: "AVGOon", yahoo: "AVGO" },
  { ticker: "METAon", yahoo: "META" },
  { ticker: "CRWDon", yahoo: "CRWD" },
  { ticker: "RKLBon", yahoo: "RKLB" },
  { ticker: "UNHon",  yahoo: "UNH" },
  { ticker: "HIMSon", yahoo: "HIMS" },
  { ticker: "VRTXon", yahoo: "VRTX" },
  { ticker: "VNQon",  yahoo: "VNQ" },
]

interface OHLC {
  date: string
  open: number
  high: number
  low: number
  close: number
}

interface YahooResponse {
  chart: {
    result: Array<{
      timestamp: number[]
      indicators: {
        quote: Array<{
          open: (number | null)[]
          high: (number | null)[]
          low: (number | null)[]
          close: (number | null)[]
        }>
      }
    }> | null
    error: { description: string } | null
  }
}

async function fetchYahoo(ticker: string, from: number, to: number): Promise<OHLC[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${from}&period2=${to}&interval=1d&events=history`
  const res = await fetch(url, {
    headers: {
      // Yahoo blocks default UAs on this endpoint
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/138.0 Safari/537.36",
    },
  })
  if (!res.ok) throw new Error(`${ticker}: HTTP ${res.status}`)
  const json = (await res.json()) as YahooResponse
  if (json.chart.error) throw new Error(`${ticker}: ${json.chart.error.description}`)
  const r = json.chart.result?.[0]
  if (!r) return []
  const ts = r.timestamp ?? []
  const q = r.indicators.quote?.[0] ?? { open: [], high: [], low: [], close: [] }

  const out: OHLC[] = []
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i]
    const h = q.high?.[i]
    const l = q.low?.[i]
    const c = q.close?.[i]
    if (o == null || h == null || l == null || c == null) continue
    out.push({
      date: new Date(ts[i] * 1000).toISOString().slice(0, 10),
      open: o,
      high: h,
      low: l,
      close: c,
    })
  }
  return out
}

function csv(rows: OHLC[]): string {
  const lines = ["date,open,high,low,close"]
  for (const r of rows) {
    lines.push(`${r.date},${r.open},${r.high},${r.low},${r.close}`)
  }
  return lines.join("\n") + "\n"
}

function dateTag(from: number, to: number): string {
  const f = new Date(from * 1000).toISOString().slice(0, 10)
  const t = new Date(to * 1000).toISOString().slice(0, 10)
  return `${f}_${t}`
}

async function main() {
  const to = Math.floor(Date.now() / 1000)
  const from = to - YEARS * 365 * 86_400
  const tag = dateTag(from, to)

  console.log(`Fetching ${YEARS}y daily closes from Yahoo for ${TOKENS.length} tickers …\n`)

  for (const t of TOKENS) {
    try {
      const rows = await fetchYahoo(t.yahoo, from, to)
      if (!rows.length) {
        console.log(`  – ${t.ticker} (${t.yahoo}): no data`)
        continue
      }
      const path = `${OUT_DIR}/${t.ticker}_${tag}.csv`
      await Bun.write(path, csv(rows))
      const span = `${rows[0].date} → ${rows[rows.length - 1].date}`
      console.log(
        `  ✓ ${t.ticker.padEnd(8)} (${t.yahoo.padEnd(6)})  ${String(rows.length).padStart(4)} rows   ${span}`,
      )
    } catch (e: any) {
      console.log(`  ✗ ${t.ticker} (${t.yahoo}): ${e.message ?? e}`)
    }
    // Light throttle to keep Yahoo happy
    await new Promise((r) => setTimeout(r, 250))
  }

  console.log("\nDone. Run import-stock-prices.ts to push into Postgres.")
}

main().catch(console.error)
