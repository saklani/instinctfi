import { Alert } from "react-native"
import { useRouter } from "expo-router"

import { Screen } from "@/components/ui/screen"
import { AppText } from "@/components/ui/text"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Row } from "@/components/ui/row"
import { Spacer } from "@/components/ui/spacer"
import { Divider } from "@/components/ui/divider"
import { useWallet } from "@/hooks/use-wallet"

export default function SettingsScreen() {
  const router = useRouter()
  const { isAuthenticated, truncatedAddress, address, user, logout } = useWallet()

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout()
          router.replace("/(auth)")
        },
      },
    ])
  }

  return (
    <Screen>
      <AppText variant="h2">Settings</AppText>
      <Spacer size="lg" />

      <Card>
        <Row align="between">
          <AppText variant="bodySmall" color="secondary">Wallet</AppText>
          <AppText variant="bodySmall" style={{ fontWeight: "600" }}>
            {truncatedAddress ?? "Not connected"}
          </AppText>
        </Row>
        <Divider spacing="sm" />
        <Row align="between">
          <AppText variant="bodySmall" color="secondary">Network</AppText>
          <AppText variant="bodySmall" style={{ fontWeight: "600" }}>
            Solana Mainnet
          </AppText>
        </Row>
        <Divider spacing="sm" />
        <Row align="between">
          <AppText variant="bodySmall" color="secondary">Status</AppText>
          <AppText
            variant="bodySmall"
            color={isAuthenticated ? "positive" : "negative"}
            style={{ fontWeight: "600" }}
          >
            {isAuthenticated ? "Connected" : "Not authenticated"}
          </AppText>
        </Row>
        {user?.linked_accounts?.find((a: any) => a.type === "email") && (
          <>
            <Divider spacing="sm" />
            <Row align="between">
              <AppText variant="bodySmall" color="secondary">Email</AppText>
              <AppText variant="bodySmall" style={{ fontWeight: "600" }}>
                {(user.linked_accounts.find((a: any) => a.type === "email") as any)?.address ?? ""}
              </AppText>
            </Row>
          </>
        )}
      </Card>

      {isAuthenticated && (
        <>
          <Spacer size="lg" />
          <Button
            title="Sign Out"
            variant="destructive"
            size="lg"
            fullWidth
            onPress={handleLogout}
          />
        </>
      )}
    </Screen>
  )
}
