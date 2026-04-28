import { Text as RNText, type TextProps, StyleSheet } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"

type Variant = "h1" | "h2" | "h3" | "body" | "bodySmall" | "caption" | "label" | "mono"
type ColorToken = "primary" | "secondary" | "positive" | "negative" | "tint"

export type AppTextProps = TextProps & {
  variant?: Variant
  color?: ColorToken
}

export function AppText({ variant = "body", color, style, ...rest }: AppTextProps) {
  const textColor = useThemeColor({}, "text")
  const secondaryColor = useThemeColor({}, "textSecondary")
  const positiveColor = useThemeColor({}, "positive")
  const negativeColor = useThemeColor({}, "negative")
  const tintColor = useThemeColor({}, "tint")

  const colorMap: Record<ColorToken, string> = {
    primary: textColor,
    secondary: secondaryColor,
    positive: positiveColor,
    negative: negativeColor,
    tint: tintColor,
  }

  const resolvedColor = color ? colorMap[color] : textColor

  return (
    <RNText
      style={[{ color: resolvedColor }, variantStyles[variant], style]}
      {...rest}
    />
  )
}

const variantStyles = StyleSheet.create({
  h1: { fontSize: 32, fontWeight: "700", letterSpacing: -1 },
  h2: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
  h3: { fontSize: 17, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 22 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  mono: { fontSize: 14, fontFamily: "ui-monospace", fontWeight: "500" },
})
