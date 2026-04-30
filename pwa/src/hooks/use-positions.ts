import { useEffect, useState } from "react"
import { fetchPositions, type Position } from "@/lib/api"
import { useWallet } from "./use-wallet"

export function usePositions() {
  const { authenticated } = useWallet()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authenticated) {
      setPositions([])
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchPositions()
        if (!cancelled) setPositions(data)
      } catch {
        if (!cancelled) setPositions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 15_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [authenticated])

  return { positions, loading }
}
