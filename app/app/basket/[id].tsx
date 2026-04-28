import { View, StyleSheet, Pressable } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"

import { Screen } from "@/components/ui/screen"
import { AppText } from "@/components/ui/text"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Row, ListRow } from "@/components/ui/row"
import { Money } from "@/components/ui/money"
import { PercentChange } from "@/components/ui/percent-change"
import { Divider } from "@/components/ui/divider"
import { Spacer } from "@/components/ui/spacer"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { useThemeColor } from "@/hooks/use-theme-color"
import { Spacing } from "@/constants/theme"
import { useAppStore } from "@/stores/use-app-store"

export default function BasketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { funds } = useAppStore()
  const tint = useThemeColor({}, "tint")
  const bg = useThemeColor({}, "background")

  const fund = funds.find((f) => f.id === id)

  if (!fund) {
    return (
      <Screen>
        <AppText variant="body">Fund not found</AppText>
      </Screen>
    )
  }

  return (
    <Screen>
      {/* Back */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <IconSymbol name="chevron.left" size={18} color={tint} />
        <AppText variant="body" color="tint">Back</AppText>
      </Pressable>

      <Spacer size="md" />

      {/* Header */}
      <AppText variant="h2">{fund.name}</AppText>
      <AppText variant="caption" color="secondary">${fund.symbol}</AppText>
      <Spacer size="sm" />
      <Money value={fund.sharePrice} variant="h1" />

      {/* Performance row */}
      <Spacer size="md" />
      <Row spacing="lg">
        {[
          { label: "24h", value: fund.performance24h },
          { label: "7d", value: fund.performance7d },
          { label: "30d", value: fund.performance30d },
        ].map(({ label, value }) => (
          <View key={label}>
            <AppText variant="caption" color="secondary">{label}</AppText>
            <PercentChange value={value} variant="body" style={{ fontWeight: "600" }} />
          </View>
        ))}
      </Row>

      <Spacer size="lg" />

      {/* Description */}
      <AppText variant="bodySmall" color="secondary">{fund.description}</AppText>

      <Spacer size="lg" />

      {/* Holdings */}
      <AppText variant="h3">Holdings</AppText>
      <Spacer size="sm" />
      {fund.holdings.map((holding) => (
        <ListRow key={holding.mint}>
          <View style={{ flex: 1 }}>
            <AppText variant="body" style={{ fontWeight: "500" }}>{holding.name}</AppText>
            <AppText variant="caption" color="secondary">{holding.symbol}</AppText>
          </View>
          <View style={styles.holdingData}>
            <Money value={holding.price} variant="bodySmall" style={{ fontWeight: "500" }} />
            <PercentChange value={holding.change24h} variant="caption" />
          </View>
          <View style={styles.weightCol}>
            <AppText variant="bodySmall" style={{ fontWeight: "600" }}>
              {(holding.targetWeight * 100).toFixed(0)}%
            </AppText>
          </View>
        </ListRow>
      ))}

      <Spacer size="lg" />

      {/* Info */}
      <AppText variant="h3">Info</AppText>
      <Spacer size="sm" />
      <Card>
        <Row align="between">
          <AppText variant="bodySmall" color="secondary">AUM</AppText>
          <Money value={fund.totalValue} compact variant="bodySmall" style={{ fontWeight: "600" }} />
        </Row>
        <Divider spacing="sm" />
        <Row align="between">
          <AppText variant="bodySmall" color="secondary">Management Fee</AppText>
          <AppText variant="bodySmall" style={{ fontWeight: "600" }}>
            {(fund.managerFee / 100).toFixed(2)}%
          </AppText>
        </Row>
        <Divider spacing="sm" />
        <Row align="between">
          <AppText variant="bodySmall" color="secondary">Rebalance</AppText>
          <AppText variant="bodySmall" style={{ fontWeight: "600" }}>
            {fund.rebalanceInterval === 0 ? "N/A" : `Every ${fund.rebalanceInterval / 3600}h`}
          </AppText>
        </Row>
      </Card>

      {/* Bottom spacing for CTA */}
      <Spacer size="xxl" />
      <Spacer size="xxl" />

      {/* Sticky Invest CTA */}
      <View style={[styles.ctaContainer, { backgroundColor: bg }]}>
        <Button
          title="Invest"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push(`/invest/${fund.id}`)}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  backButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  holdingData: { alignItems: "flex-end", marginRight: Spacing.md },
  weightCol: { width: 40, alignItems: "flex-end" },
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
})
