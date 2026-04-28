import { View } from "react-native"
import { Spacing } from "@/constants/theme"

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "xxl"

export function Spacer({ size = "md" }: { size?: Size }) {
  return <View style={{ height: Spacing[size] }} />
}

export function HSpacer({ size = "md" }: { size?: Size }) {
  return <View style={{ width: Spacing[size] }} />
}
