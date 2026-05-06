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

export function formatRaw(raw: string | number, decimals: number = 6): string {
  return usdFormatter.format(Number(raw) / 10 ** decimals)
}

export function formatShares(value: string | number): string {
  return sharesFormatter.format(Number(value))
}

export function formatPercent(bps: number): string {
  return `${(bps / 100).toFixed(0)}%`
}

export function truncateAddress(address: string, head: number = 4, tail: number = 4): string {
  if (!address) return ""
  if (address.length <= head + tail + 1) return address
  return `${address.slice(0, head)}…${address.slice(-tail)}`
}
