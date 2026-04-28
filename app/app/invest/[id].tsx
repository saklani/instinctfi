import { useState } from "react"
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"

import { Screen } from "@/components/ui/screen"
import { AppText } from "@/components/ui/text"
import { AppInput } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { Row } from "@/components/ui/row"
import { Divider } from "@/components/ui/divider"
import { Money } from "@/components/ui/money"
import { Spacer } from "@/components/ui/spacer"
import { Spacing } from "@/constants/theme"
import { useAppStore } from "@/stores/use-app-store"

export default function InvestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { funds, usdcBalance, setUsdcBalance, addPosition } = useAppStore()
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const fund = funds.find((f) => f.id === id)

  if (!fund) {
    return (
      <Screen>
        <AppText variant="body">Fund not found</AppText>
      </Screen>
    )
  }

  const numAmount = parseFloat(amount) || 0
  const sharesReceived = numAmount / fund.sharePrice
  const isValid = numAmount > 0 && numAmount <= usdcBalance

  const handleInvest = async () => {
    if (!isValid) return

    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setUsdcBalance(usdcBalance - numAmount)
    addPosition({
      fundId: fund.id,
      fund,
      shares: sharesReceived,
      avgPrice: fund.sharePrice,
      currentValue: numAmount,
      pnl: 0,
      pnlPercent: 0,
    })

    setIsProcessing(false)
    Alert.alert(
      "Investment Successful",
      `You invested $${numAmount.toFixed(2)} in ${fund.name} and received ${sharesReceived.toFixed(4)} shares.`,
      [{ text: "Done", onPress: () => router.dismiss() }]
    )
  }

  const presets = [25, 50, 100, 250]

  return (
    <Screen scrollable={false} padded>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <AppText variant="h2">Invest in {fund.name}</AppText>
          <AppText variant="bodySmall" color="secondary">
            ${fund.symbol} · ${fund.sharePrice.toFixed(2)} per share
          </AppText>

          <Spacer size="xl" />

          {/* Amount input */}
          <AppInput
            label="Amount (USDC)"
            prefix="$"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            autoFocus
          />
          <Spacer size="xs" />
          <AppText variant="caption" color="secondary">
            Available: ${usdcBalance.toFixed(2)} USDC
          </AppText>

          {/* Preset chips */}
          <Spacer size="md" />
          <Row spacing="sm">
            {presets.map((preset) => (
              <Chip
                key={preset}
                label={`$${preset}`}
                selected={amount === String(preset)}
                onPress={() => setAmount(String(Math.min(preset, usdcBalance)))}
              />
            ))}
            <Chip
              label="Max"
              selected={amount === String(usdcBalance)}
              onPress={() => setAmount(String(usdcBalance))}
            />
          </Row>

          {/* Summary */}
          {numAmount > 0 && (
            <>
              <Spacer size="lg" />
              <Card>
                <Row align="between">
                  <AppText variant="bodySmall" color="secondary">You pay</AppText>
                  <Money value={numAmount} variant="bodySmall" style={{ fontWeight: "600" }} />
                </Row>
                <Divider spacing="sm" />
                <Row align="between">
                  <AppText variant="bodySmall" color="secondary">You receive</AppText>
                  <AppText variant="bodySmall" style={{ fontWeight: "600" }}>
                    {sharesReceived.toFixed(4)} {fund.symbol}
                  </AppText>
                </Row>
                <Divider spacing="sm" />
                <Row align="between">
                  <AppText variant="bodySmall" color="secondary">Price per share</AppText>
                  <Money value={fund.sharePrice} variant="bodySmall" style={{ fontWeight: "600" }} />
                </Row>
              </Card>
            </>
          )}
        </View>

        {/* Confirm button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isProcessing ? "Processing..." : "Confirm Investment"}
            variant="primary"
            size="lg"
            fullWidth
            loading={isProcessing}
            disabled={!isValid}
            onPress={handleInvest}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingTop: Spacing.lg },
  buttonContainer: { paddingBottom: Spacing.xl },
})
