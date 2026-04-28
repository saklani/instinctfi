import { Pressable, type PressableProps, StyleSheet } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { BorderRadius, Spacing } from "@/constants/theme"
import { AppText } from "./text"

export type ChipProps = PressableProps & {
  label: string
  selected?: boolean
}

export function Chip({ label, selected = false, style, ...rest }: ChipProps) {
  const surface = useThemeColor({}, "surface")
  const tint = useThemeColor({}, "tint")
  const text = useThemeColor({}, "text")

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? `${tint}20` : surface,
          borderColor: selected ? tint : "transparent",
          opacity: pressed ? 0.8 : 1,
        },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
      {...rest}
    >
      <AppText
        variant="bodySmall"
        style={{ color: selected ? tint : text, fontWeight: selected ? "600" : "400" }}
      >
        {label}
      </AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
})
