import { useState } from "react"
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native"
import { useRouter } from "expo-router"
import { useLoginWithEmail } from "@privy-io/expo"

import { Screen } from "@/components/ui/screen"
import { AppText } from "@/components/ui/text"
import { AppInput } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spacer } from "@/components/ui/spacer"
import { Spacing } from "@/constants/theme"

export default function EmailScreen() {
  const router = useRouter()
  const { sendCode } = useLoginWithEmail()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isValid = email.includes("@") && email.includes(".")

  const handleSendCode = async () => {
    if (!isValid) return
    setLoading(true)
    setError("")

    try {
      await sendCode({ email })
      router.push({ pathname: "/(auth)/verify", params: { email } })
    } catch (e) {
      setError("Failed to send code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen scrollable={false} padded>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <View>
            <AppText variant="h2">Enter your email</AppText>
            <Spacer size="xs" />
            <AppText variant="bodySmall" color="secondary">
              We'll send you a verification code.
            </AppText>
          </View>

          <Spacer size="lg" />

          <AppInput
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            error={error}
          />

          <Spacer size="lg" />

          <Button
            title={loading ? "Sending..." : "Send Code"}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!isValid}
            onPress={handleSendCode}
          />
        </View>

        <View style={styles.back}>
          <Button
            title="Back"
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: "center" },
  back: { paddingBottom: Spacing.lg, alignItems: "center" },
})
