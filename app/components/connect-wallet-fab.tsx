import { useState } from "react"
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
} from "react-native"
import { usePrivy, useLoginWithEmail } from "@privy-io/expo"

import { Colors, Spacing, BorderRadius } from "@/constants/theme"
import { useColorScheme } from "@/hooks/use-color-scheme"

export function ConnectWalletFab() {
  const colorScheme = useColorScheme() ?? "dark"
  const colors = Colors[colorScheme]
  const { isReady, user } = usePrivy()
  const [sheetOpen, setSheetOpen] = useState(false)

  // Don't show FAB if already connected or not ready
  if (!isReady || user) return null

  return (
    <>
      {/* FAB */}
      <View style={styles.fabContainer}>
        <Pressable
          style={[styles.fab, { backgroundColor: colors.tint }]}
          onPress={() => setSheetOpen(true)}
        >
          <Text style={styles.fabText}>Connect Wallet</Text>
        </Pressable>
      </View>

      {/* Bottom Drawer */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setSheetOpen(false)}
        />
        <View
          style={[
            styles.drawer,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.drawerTitle, { color: colors.text }]}>
            Connect to Instinct
          </Text>
          <Text style={[styles.drawerSubtitle, { color: colors.textSecondary }]}>
            Sign in to start investing in tokenized US equities.
          </Text>

          <View style={styles.options}>
            <EmailLogin colors={colors} onDone={() => setSheetOpen(false)} />

            <Pressable
              style={[styles.optionButton, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => {
                // TODO: external wallet connection
              }}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>
                Connect Phantom
              </Text>
            </Pressable>

            <Pressable
              style={[styles.optionButton, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => {
                // TODO: external wallet connection
              }}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>
                Connect Solflare
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  )
}

function EmailLogin({
  colors,
  onDone,
}: {
  colors: typeof Colors.dark
  onDone: () => void
}) {
  const { sendCode, loginWithCode } = useLoginWithEmail({
    onLoginSuccess: () => onDone(),
  })
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  if (step === "email") {
    return (
      <View style={styles.emailSection}>
        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: email ? colors.text : colors.textSecondary,
                fontSize: 15,
              }}
              numberOfLines={1}
            >
              {email || "you@example.com"}
            </Text>
          </View>
        </View>
        {/* Simple text input workaround — using a real TextInput would be better */}
        <Pressable
          style={[styles.optionButton, { backgroundColor: colors.tint }]}
          onPress={async () => {
            // For now, prompt with a simple approach
            // In production, use a proper TextInput
            const promptEmail = "user@example.com" // placeholder
            setEmail(promptEmail)
            setLoading(true)
            try {
              await sendCode({ email: promptEmail })
              setStep("code")
            } catch {
              // handle error
            }
            setLoading(false)
          }}
        >
          <Text style={[styles.optionText, { color: "#FFF" }]}>
            {loading ? "Sending..." : "Continue with Email"}
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.emailSection}>
      <Pressable
        style={[styles.optionButton, { backgroundColor: colors.tint }]}
        onPress={async () => {
          setLoading(true)
          try {
            await loginWithCode({ code, email })
          } catch {
            // handle error
          }
          setLoading(false)
        }}
      >
        <Text style={[styles.optionText, { color: "#FFF" }]}>
          {loading ? "Verifying..." : "Verify Code"}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  fab: {
    width: "100%",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  fabText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 20,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  drawerSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  options: {
    gap: Spacing.sm,
  },
  optionButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  emailSection: {
    gap: Spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
})
