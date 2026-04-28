import { View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Screen } from "@/components/ui/screen"
import { AppText } from "@/components/ui/text"
import { Card, PressableCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Row } from "@/components/ui/row"
import { Money } from "@/components/ui/money"
import { PercentChange } from "@/components/ui/percent-change"
import { Spacer } from "@/components/ui/spacer"
import { Spacing } from "@/constants/theme"
import { useAppStore } from "@/stores/use-app-store"

export default function PortfolioScreen() {
  const router = useRouter()
  const { positions, usdcBalance } = useAppStore()

  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0)
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0)

  return (
    <Screen>
      {/* Header */}
      <AppText variant="bodySmall" color="secondary">Portfolio</AppText>
      <Money value={totalValue + usdcBalance} variant="h1" />
      {totalPnl !== 0 && (
        <Money
          value={totalPnl}
          showSign
          variant="bodySmall"
          color={totalPnl >= 0 ? "positive" : "negative"}
          style={{ fontWeight: "600", marginTop: 2 }}
        />
      )}

      <Spacer size="lg" />

      {/* USDC Balance */}
      <Card>
        <Row align="between">
          <AppText variant="bodySmall" color="secondary">Available USDC</AppText>
          <Money value={usdcBalance} variant="body" style={{ fontWeight: "600" }} />
        </Row>
      </Card>

      <Spacer size="lg" />

      {/* Positions or Empty State */}
      {positions.length === 0 ? (
        <View style={styles.emptyState}>
          <AppText variant="h3">No investments yet</AppText>
          <Spacer size="sm" />
          <AppText variant="bodySmall" color="secondary" style={styles.emptySubtitle}>
            Browse index funds and start investing in tokenized US equities.
          </AppText>
          <Spacer size="lg" />
          <Button
            title="Explore Funds"
            variant="primary"
            size="md"
            onPress={() => router.push("/(tabs)/discover")}
          />
        </View>
      ) : (
        <>
          <AppText variant="h3">Holdings</AppText>
          <Spacer size="md" />
          {positions.map((position) => (
            <PressableCard
              key={position.fundId}
              style={styles.positionCard}
              onPress={() => router.push(`/basket/${position.fundId}`)}
            >
              <View>
                <AppText variant="body" style={{ fontWeight: "600" }}>
                  {position.fund.name}
                </AppText>
                <AppText variant="caption" color="secondary">
                  {position.shares.toFixed(2)} shares
                </AppText>
              </View>
              <View style={styles.positionValues}>
                <Money value={position.currentValue} variant="body" style={{ fontWeight: "600" }} />
                <PercentChange value={position.pnlPercent} variant="caption" />
              </View>
            </PressableCard>
          ))}
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  emptyState: { alignItems: "center", paddingTop: Spacing.xxl },
  emptySubtitle: { textAlign: "center" },
  positionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  positionValues: { alignItems: "flex-end" },
})
