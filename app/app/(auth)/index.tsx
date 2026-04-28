import { View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { usePrivy } from "@privy-io/expo"
import { useEffect } from "react"

import { Screen } from "@/components/ui/screen"
import { AppText } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Spacer } from "@/components/ui/spacer"
import { Spacing } from "@/constants/theme"

export default function OnboardingScreen() {
  const router = useRouter()
  const { isReady, user } = usePrivy()

  useEffect(() => {
    if (isReady && user) {
      router.replace("/(tabs)")
    }
  }, [isReady, user])

  if (!isReady) {
    return (
      <Screen scrollable={false} padded>
        <View style={styles.center}>
          <AppText variant="body" color="secondary">
            Loading...
          </AppText>
        </View>
      </Screen>
    )
  }

  return (
    <Screen scrollable={false} padded>
      <View style={styles.content}>
        <View style={styles.hero}>
          <AppText variant="h1">Invest in{"\n"}US Stocks</AppText>
          <Spacer size="sm" />
          <AppText variant="body" color="secondary" style={styles.subtitle}>
            Tokenized equities on Solana. Diversified index funds. One tap.
            Available globally.
          </AppText>
        </View>

        <View style={styles.actions}>
          <Button
            title="Continue with Email"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.push("/(auth)/email")}
          />
          <Spacer size="sm" />
          <Button
            title="Connect Wallet"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => {
              // TODO: Privy external wallet connection
            }}
          />
          <Spacer size="md" />
          <AppText
            variant="caption"
            color="secondary"
            style={styles.terms}
          >
            By continuing you agree to our Terms of Service and Privacy Policy
          </AppText>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1, justifyContent: "space-between" },
  hero: { flex: 1, justifyContent: "center" },
  subtitle: { lineHeight: 22 },
  actions: { paddingBottom: Spacing.xl },
  terms: { textAlign: "center" },
})
