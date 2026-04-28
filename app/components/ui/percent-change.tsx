import { AppText, type AppTextProps } from "./text"

export type PercentChangeProps = Omit<AppTextProps, "color" | "children"> & {
  value: number
  showSign?: boolean
}

export function PercentChange({ value, showSign = true, ...rest }: PercentChangeProps) {
  const sign = value >= 0 ? "+" : ""
  const color = value >= 0 ? "positive" : "negative"

  return (
    <AppText color={color} {...rest}>
      {showSign ? sign : ""}
      {value.toFixed(1)}%
    </AppText>
  )
}
