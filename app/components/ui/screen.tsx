import { ScrollView, View, StyleSheet, type ViewProps } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useThemeColor } from "@/hooks/use-theme-color"
import { Spacing } from "@/constants/theme"

export type ScreenProps = ViewProps & {
  scrollable?: boolean
  padded?: boolean
}

export function Screen({
  scrollable = true,
  padded = true,
  children,
  style,
  ...rest
}: ScreenProps) {
  const bg = useThemeColor({}, "background")

  const content = (
    <View style={[padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  padded: { paddingHorizontal: Spacing.lg },
})
