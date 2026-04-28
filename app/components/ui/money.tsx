import { AppText, type AppTextProps } from "./text"

export type MoneyProps = Omit<AppTextProps, "children"> & {
  value: number
  compact?: boolean
  showSign?: boolean
}

export function Money({ value, compact = false, showSign = false, ...rest }: MoneyProps) {
  let formatted: string

  if (compact) {
    if (Math.abs(value) >= 1_000_000_000) {
      formatted = `$${(value / 1_000_000_000).toFixed(1)}B`
    } else if (Math.abs(value) >= 1_000_000) {
      formatted = `$${(value / 1_000_000).toFixed(1)}M`
    } else if (Math.abs(value) >= 1_000) {
      formatted = `$${(value / 1_000).toFixed(1)}K`
    } else {
      formatted = `$${value.toFixed(2)}`
    }
  } else {
    formatted = `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (showSign && value > 0) {
    formatted = `+${formatted}`
  }

  return <AppText {...rest}>{formatted}</AppText>
}
