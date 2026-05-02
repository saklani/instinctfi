import type { ChartPoint } from "@/components/chart/nav-chart"

// Static NAV series baked in at build time (no network request).
// Re-run `bun run scripts/fetch-ohlcv.ts` to refresh.
import peloRaw from "@assets/data/PELO_NAV_2026-02-01_2026-05-02.csv?raw"
import affcRaw from "@assets/data/AFFC_NAV_2026-02-01_2026-05-02.csv?raw"

function parseCsv(raw: string): ChartPoint[] {
  return raw
    .trim()
    .split("\n")
    .slice(1) // skip header
    .map((line) => {
      const [date, value] = line.split(",")
      return { date, value: Number(value) }
    })
}

const NAV_SERIES: Record<string, ChartPoint[]> = {
  pelo: parseCsv(peloRaw),
  affc: parseCsv(affcRaw),
}

/** Look up static NAV series by vault name, filtered to the last `days` days. */
export function getNavSeries(vaultName: string, days?: number): ChartPoint[] {
  const key = vaultName.trim().toLowerCase()
  let series: ChartPoint[]
  if (key.includes("pelosi")) series = NAV_SERIES.pelo
  else if (key.includes("anti finance") || key.includes("affc")) series = NAV_SERIES.affc
  else return []

  if (!days) return series

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return series.filter((p) => p.date >= cutoffStr)
}
