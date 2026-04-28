import { useEffect, useState } from "react"
import { Connection, PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddress } from "@solana/spl-token"
import { useWallet } from "./use-wallet"

const connection = new Connection("https://api.devnet.solana.com", "confirmed")

const VAULT_MINT = new PublicKey(import.meta.env.VITE_VAULT_MINT)
const VAULT_DECIMALS = 6

export function useVaultBalance() {
  const { address } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [rawBalance, setRawBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) {
      setBalance(null)
      setRawBalance(null)
      return
    }

    let cancelled = false

    const fetch = async () => {
      setLoading(true)
      try {
        const owner = new PublicKey(address)
        const ata = await getAssociatedTokenAddress(VAULT_MINT, owner)
        const info = await connection.getTokenAccountBalance(ata)
        const raw = Number(info.value.amount)
        if (!cancelled) {
          setRawBalance(raw)
          setBalance(raw / Math.pow(10, VAULT_DECIMALS))
        }
      } catch {
        if (!cancelled) {
          setBalance(0)
          setRawBalance(0)
        }
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

  return { balance, rawBalance, loading }
}
