import { useEffect, useState } from "react"
import { Connection, PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddress } from "@solana/spl-token"
import { useWallet } from "./use-wallet"

const connection = new Connection("https://api.devnet.solana.com", "confirmed")

// Symmetry devnet USDC mint
const USDC_MINT = new PublicKey("USDCoctVLVnvTXBEuP9s8hntucdJokbo17RwHuNXemT")
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
