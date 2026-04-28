import { View, StyleSheet } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { Spacing } from "@/constants/theme"

export type DividerProps = {
  spacing?: "none" | "sm" | "md" | "lg"
}

export function Divider({ spacing = "md" }: DividerProps) {
  const borderColor = useThemeColor({}, "border")

  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: borderColor },
        spacing !== "none" && spacingStyles[spacing],
      ]}
    />
  )
}

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, width: "100%" },
})

const spacingStyles = StyleSheet.create({
  sm: { marginVertical: Spacing.sm },
  md: { marginVertical: Spacing.md },
  lg: { marginVertical: Spacing.lg },
})
