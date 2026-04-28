import { View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Screen } from "@/components/ui/screen"
import { AppText } from "@/components/ui/text"
import { PressableCard } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Money } from "@/components/ui/money"
import { PercentChange } from "@/components/ui/percent-change"
import { Row } from "@/components/ui/row"
import { Spacer } from "@/components/ui/spacer"
import { Spacing } from "@/constants/theme"
import { useAppStore } from "@/stores/use-app-store"
import { IndexFund } from "@/types"

function FundCard({ fund }: { fund: IndexFund }) {
  const router = useRouter()

  return (
    <PressableCard
      style={styles.fundCard}
      onPress={() => router.push(`/basket/${fund.id}`)}
    >
      {/* Header row */}
      <Row align="between" style={{ marginBottom: Spacing.sm }}>
        <View>
          <AppText variant="h3">{fund.name}</AppText>
          <AppText variant="caption" color="secondary">${fund.symbol}</AppText>
        </View>
        <View style={styles.priceCol}>
          <Money value={fund.sharePrice} variant="h3" />
          <PercentChange value={fund.performance24h} variant="caption" />
        </View>
      </Row>

      {/* Description */}
      <AppText variant="bodySmall" color="secondary" numberOfLines={2} style={{ marginBottom: Spacing.md }}>
        {fund.description}
      </AppText>

      {/* Holdings chips */}
      <View style={styles.holdingsRow}>
        {fund.holdings.slice(0, 4).map((holding) => (
          <Badge
            key={holding.mint}
            label={`${holding.symbol.replace("x", "")} ${(holding.targetWeight * 100).toFixed(0)}%`}
          />
        ))}
        {fund.holdings.length > 4 && (
          <Badge label={`+${fund.holdings.length - 4}`} />
        )}
      </View>
    </PressableCard>
  )
}

export default function DiscoverScreen() {
  const { funds } = useAppStore()

  return (
    <Screen>
      <AppText variant="h2">Discover</AppText>
      <Spacer size="xs" />
      <AppText variant="bodySmall" color="secondary">
        Invest in tokenized US equities through diversified index funds.
      </AppText>

      <Spacer size="lg" />

      <View style={styles.fundsList}>
        {funds.map((fund) => (
          <FundCard key={fund.id} fund={fund} />
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  fundsList: { gap: Spacing.md },
  fundCard: {},
  priceCol: { alignItems: "flex-end" },
  holdingsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
})
