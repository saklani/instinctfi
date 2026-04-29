import { useEffect, useState } from "react"
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { useWallet } from "./use-wallet"

const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=7ab8b174-ab40-4c2a-aef7-93a19dbd364c", "confirmed")

export function useSolBalance() {
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
        const lamports = await connection.getBalance(new PublicKey(address))
        if (!cancelled) setBalance(lamports / LAMPORTS_PER_SOL)
      } catch {
        if (!cancelled) setBalance(null)
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
