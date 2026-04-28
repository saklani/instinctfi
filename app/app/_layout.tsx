import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import "react-native-reanimated"
import { PrivyProvider } from "@privy-io/expo"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { ConnectWalletFab } from "@/components/connect-wallet-fab"

const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? ""
const PRIVY_CLIENT_ID = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? ""

export const unstable_settings = {
  anchor: "(tabs)",
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <PrivyProvider appId={PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="basket/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="invest/[id]" options={{ presentation: "modal" }} />
        </Stack>
        <ConnectWalletFab />
        <StatusBar style="auto" />
      </ThemeProvider>
    </PrivyProvider>
  )
}
