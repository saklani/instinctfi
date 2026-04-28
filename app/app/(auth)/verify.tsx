import { useState, useRef } from "react"
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useLoginWithEmail } from "@privy-io/expo"

import { Screen } from "@/components/ui/screen"
import { AppText } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Spacer } from "@/components/ui/spacer"
import { useThemeColor } from "@/hooks/use-theme-color"
import { BorderRadius, Spacing } from "@/constants/theme"

const CODE_LENGTH = 6

export default function VerifyScreen() {
  const router = useRouter()
  const { email } = useLocalSearchParams<{ email: string }>()
  const { loginWithCode, sendCode } = useLoginWithEmail()

  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<TextInput>(null)

  const text = useThemeColor({}, "text")
  const surface = useThemeColor({}, "surface")
  const border = useThemeColor({}, "border")
  const tint = useThemeColor({}, "tint")

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH || !email) return
    setLoading(true)
    setError("")

    try {
      await loginWithCode({ code, email })
      router.replace("/(tabs)")
    } catch (e) {
      setError("Invalid code. Please try again.")
      setCode("")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return
    try {
      await sendCode({ email })
    } catch (e) {
      // Silently fail resend
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
            <AppText variant="h2">Verification code</AppText>
            <Spacer size="xs" />
            <AppText variant="bodySmall" color="secondary">
              Sent to {email}
            </AppText>
          </View>

          <Spacer size="xl" />

          {/* Code display boxes */}
          <Pressable style={styles.codeContainer} onPress={() => inputRef.current?.focus()}>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.codeBox,
                  {
                    backgroundColor: surface,
                    borderColor: i === code.length ? tint : border,
                    borderWidth: i === code.length ? 2 : 1,
                  },
                ]}
              >
                <AppText variant="h2" style={{ color: text }}>
                  {code[i] ?? ""}
                </AppText>
              </View>
            ))}
          </Pressable>

          {/* Hidden input */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH)
              setCode(cleaned)
            }}
            keyboardType="number-pad"
            autoFocus
            textContentType="oneTimeCode"
          />

          {error ? (
            <>
              <Spacer size="sm" />
              <AppText variant="bodySmall" color="negative" style={styles.error}>
                {error}
              </AppText>
            </>
          ) : null}

          <Spacer size="lg" />

          <Button
            title={loading ? "Verifying..." : "Verify"}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={code.length !== CODE_LENGTH}
            onPress={handleVerify}
          />

          <Spacer size="md" />

          <Pressable onPress={handleResend}>
            <AppText variant="bodySmall" color="tint" style={styles.resend}>
              Didn't get a code? Resend
            </AppText>
          </Pressable>
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
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 0,
    width: 0,
  },
  error: { textAlign: "center" },
  resend: { textAlign: "center" },
  back: { paddingBottom: Spacing.lg, alignItems: "center" },
})
