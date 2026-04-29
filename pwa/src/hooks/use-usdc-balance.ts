import { useEffect, useState } from "react"
import { Connection, PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddress } from "@solana/spl-token"
import { useWallet } from "./use-wallet"

const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=7ab8b174-ab40-4c2a-aef7-93a19dbd364c", "confirmed")

// Mainnet USDC mint
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
const USDC_DECIMALS = 6

export function useUsdcBalance() {
  const { address } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) {
      setBalance(null)
      return
    }

    let cancelled = false

    const fetch = async () => {
      setLoading(true)
      try {
        const owner = new PublicKey(address)
        const ata = await getAssociatedTokenAddress(USDC_MINT, owner)
        const info = await connection.getTokenAccountBalance(ata)
        if (!cancelled) {
          setBalance(
            Number(info.value.amount) / Math.pow(10, USDC_DECIMALS),
          )
        }
      } catch {
        // Token account doesn't exist = 0 balance
        if (!cancelled) setBalance(0)
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

  return { balance, loading }
}
