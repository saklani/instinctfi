const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const sharesFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

export function formatUsd(value: number): string {
  return usdFormatter.format(value)
}

export function formatUsdcRaw(raw: string): string {
  return usdFormatter.format(Number(raw) / 1e6)
}

export function formatShares(value: string | number): string {
  return sharesFormatter.format(Number(value))
}

export function formatPercent(bps: number): string {
  return `${(bps / 100).toFixed(0)}%`
}
