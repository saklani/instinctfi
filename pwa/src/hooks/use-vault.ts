import { useEffect, useState } from "react"
import { fetchVaultData } from "@/lib/symmetry"

const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS

export interface VaultAsset {
  mint: string
  weight: number
  amount: number
  active: boolean
}

export interface VaultData {
  name: string
  symbol: string
  tvl: string | null
  price: string | null
  supplyOutstanding: number
  composition: VaultAsset[]
  feeSettings: {
    creatorDepositFeeBps: number
    creatorWithdrawFeeBps: number
  }
}

export function useVault() {
  const [vault, setVault] = useState<VaultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = await fetchVaultData(VAULT_ADDRESS)
      const info = raw.formatted!

      setVault({
        name: info.name,
        symbol: info.symbol,
        tvl: raw.tvl?.toString() ?? null,
        price: raw.price?.toString() ?? null,
        supplyOutstanding: info.supply_outstanding,
        composition: info.composition
          .filter((a: any) => a.active)
          .map((a: any) => ({
            mint: a.mint,
            weight: a.weight,
            amount: a.amount,
            active: a.active,
          })),
        feeSettings: {
          creatorDepositFeeBps: info.fee_settings.creator_deposit_fee_bps,
          creatorWithdrawFeeBps: info.fee_settings.creator_withdraw_fee_bps,
        },
      })
    } catch (e: any) {
      setError(e.message ?? "Failed to load vault")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return { vault, loading, error, refetch: load }
}
