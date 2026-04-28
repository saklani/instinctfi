import { View, Pressable, StyleSheet, type ViewProps, type PressableProps } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { Spacing } from "@/constants/theme"

export type RowProps = ViewProps & {
  spacing?: "none" | "sm" | "md" | "lg"
  align?: "start" | "center" | "end" | "between"
}

export function Row({ spacing = "md", align = "center", style, ...rest }: RowProps) {
  const alignMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "center",
  } as const

  return (
    <View
      style={[
        styles.row,
        {
          gap: spacing === "none" ? 0 : Spacing[spacing],
          alignItems: alignMap[align],
          justifyContent: align === "between" ? "space-between" : "flex-start",
        },
        style,
      ]}
      {...rest}
    />
  )
}

export type ListRowProps = PressableProps & {
  showBorder?: boolean
}

export function ListRow({ showBorder = true, style, ...rest }: ListRowProps) {
  const border = useThemeColor({}, "border")

  return (
    <Pressable
      style={({ pressed }) => [
        styles.listRow,
        showBorder && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border },
        { opacity: pressed ? 0.7 : 1 },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm + 2,
  },
})
