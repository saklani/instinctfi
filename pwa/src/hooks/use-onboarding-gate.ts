import * as React from "react"

import { useWallet } from "@/hooks/use-wallet"
import { usePositions } from "@/features/positions"
import { getOnboardingSeen, setOnboardingSeen } from "@/lib/onboarding"

type OnboardingGate = {
  visible: boolean
  dismiss: () => void
}

export function useOnboardingGate(): OnboardingGate {
  const { ready, authenticated } = useWallet()
  const { positions, loading } = usePositions()
  const [seen, setSeen] = React.useState<boolean>(() => getOnboardingSeen())

  const visible =
    ready && authenticated && !loading && positions.length === 0 && !seen

  const dismiss = React.useCallback(() => {
    setOnboardingSeen()
    setSeen(true)
  }, [])

  return { visible, dismiss }
}
