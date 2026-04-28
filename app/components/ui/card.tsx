import { View, Pressable, type ViewProps, type PressableProps, StyleSheet } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { BorderRadius, Spacing } from "@/constants/theme"

export type CardProps = ViewProps & {
  variant?: "default" | "elevated"
  padding?: "none" | "sm" | "md" | "lg"
}

export function Card({ variant = "default", padding = "md", style, ...rest }: CardProps) {
  const bg = useThemeColor({}, variant === "elevated" ? "surfaceElevated" : "surface")

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: bg },
        padding !== "none" && paddingStyles[padding],
        style,
      ]}
      {...rest}
    />
  )
}

export type PressableCardProps = PressableProps & {
  variant?: "default" | "elevated"
  padding?: "none" | "sm" | "md" | "lg"
}

export function PressableCard({
  variant = "default",
  padding = "md",
  style,
  ...rest
}: PressableCardProps) {
  const bg = useThemeColor({}, variant === "elevated" ? "surfaceElevated" : "surface")

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: pressed ? 0.8 : 1 },
        padding !== "none" && paddingStyles[padding],
        typeof style === "function" ? style({ pressed }) : style,
      ]}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: BorderRadius.md },
})

const paddingStyles = StyleSheet.create({
  sm: { padding: Spacing.sm },
  md: { padding: Spacing.md },
  lg: { padding: Spacing.lg },
})
