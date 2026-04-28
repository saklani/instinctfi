import { View, StyleSheet } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { BorderRadius, Spacing } from "@/constants/theme"
import { AppText } from "./text"

type Variant = "default" | "positive" | "negative" | "tint"

export type BadgeProps = {
  label: string
  variant?: Variant
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  const surface = useThemeColor({}, "surfaceElevated")
  const positive = useThemeColor({}, "positive")
  const negative = useThemeColor({}, "negative")
  const tint = useThemeColor({}, "tint")
  const text = useThemeColor({}, "text")

  const colorMap: Record<Variant, { bg: string; text: string }> = {
    default: { bg: surface, text },
    positive: { bg: `${positive}20`, text: positive },
    negative: { bg: `${negative}20`, text: negative },
    tint: { bg: `${tint}20`, text: tint },
  }

  const colors = colorMap[variant]

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <AppText variant="caption" style={[styles.text, { color: colors.text }]}>
        {label}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  text: { fontWeight: "600" },
})
