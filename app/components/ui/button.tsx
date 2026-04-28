import { Pressable, type PressableProps, StyleSheet, ActivityIndicator } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { BorderRadius, Spacing } from "@/constants/theme"
import { AppText } from "./text"

type Variant = "primary" | "secondary" | "ghost" | "destructive"
type Size = "sm" | "md" | "lg"

export type ButtonProps = PressableProps & {
  title: string
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const tint = useThemeColor({}, "tint")
  const surface = useThemeColor({}, "surface")
  const destructive = useThemeColor({}, "negative")
  const textColor = useThemeColor({}, "text")
  const secondaryText = useThemeColor({}, "textSecondary")

  const bgMap: Record<Variant, string> = {
    primary: tint,
    secondary: surface,
    ghost: "transparent",
    destructive: destructive,
  }

  const textColorMap: Record<Variant, string> = {
    primary: "#FFFFFF",
    secondary: textColor,
    ghost: tint,
    destructive: "#FFFFFF",
  }

  const isDisabled = disabled || loading

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: bgMap[variant],
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
        typeof style === "function" ? style({ pressed }) : style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColorMap[variant]} size="small" />
      ) : (
        <AppText
          variant="bodySmall"
          style={[
            styles.text,
            sizeTextStyles[size],
            { color: isDisabled ? secondaryText : textColorMap[variant] },
          ]}
        >
          {title}
        </AppText>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: { width: "100%" },
  text: { fontWeight: "600" },
})

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, minHeight: 32 },
  md: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, minHeight: 44 },
  lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, minHeight: 52 },
})

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
})
