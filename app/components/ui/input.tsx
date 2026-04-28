import { TextInput, View, StyleSheet, type TextInputProps } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"
import { BorderRadius, Spacing } from "@/constants/theme"
import { AppText } from "./text"

export type AppInputProps = TextInputProps & {
  label?: string
  prefix?: string
  error?: string
}

export function AppInput({ label, prefix, error, style, ...rest }: AppInputProps) {
  const text = useThemeColor({}, "text")
  const secondary = useThemeColor({}, "textSecondary")
  const border = useThemeColor({}, "border")
  const negative = useThemeColor({}, "negative")
  const surface = useThemeColor({}, "surface")

  return (
    <View style={styles.wrapper}>
      {label && (
        <AppText variant="caption" color="secondary" style={styles.label}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.container,
          {
            borderColor: error ? negative : border,
            backgroundColor: surface,
          },
        ]}
      >
        {prefix && (
          <AppText variant="h2" color="secondary" style={styles.prefix}>
            {prefix}
          </AppText>
        )}
        <TextInput
          style={[styles.input, { color: text }, style]}
          placeholderTextColor={secondary}
          {...rest}
        />
      </View>
      {error && (
        <AppText variant="caption" style={{ color: negative, marginTop: Spacing.xs }}>
          {error}
        </AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {},
  label: { marginBottom: Spacing.xs },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  prefix: { marginRight: Spacing.xs },
  input: { flex: 1, fontSize: 22, fontWeight: "600", paddingVertical: Spacing.sm },
})
