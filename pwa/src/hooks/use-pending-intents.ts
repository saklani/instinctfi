import { useEffect, useState } from "react"
import { getSDK } from "@/lib/symmetry"
import { useWallet } from "./use-wallet"

export interface PendingIntent {
  pubkey: string
  type: "deposit" | "withdraw"
  action: string
  tokens: { mint: string; amount: number }[]
}

export function usePendingIntents() {
  const { address } = useWallet()
  const [intents, setIntents] = useState<PendingIntent[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) {
      setIntents([])
      return
    }

    let cancelled = false

    const fetch = async () => {
      setLoading(true)
      try {
        const sdk = getSDK()
        const all = await sdk.fetchVaultRebalanceIntents(
          import.meta.env.VITE_VAULT_ADDRESS,
        )
        const mine = all
          .filter((i: any) => i.formatted_data?.owner === address)
          .map((i: any) => ({
            pubkey: i.formatted_data.pubkey,
            type: i.formatted_data.rebalance_type as "deposit" | "withdraw",
            action: i.formatted_data.current_action,
            tokens: i.formatted_data.tokens
              ?.filter((t: any) => t.amount > 0)
              .map((t: any) => ({ mint: t.mint, amount: t.amount })) ?? [],
          }))
        if (!cancelled) setIntents(mine)
      } catch {
        if (!cancelled) setIntents([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    const interval = setInterval(fetch, 15_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [address])

  return { intents, loading }
}
