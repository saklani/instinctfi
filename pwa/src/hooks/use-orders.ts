import { useEffect, useState } from "react"
import { fetchOrders, type Order } from "@/lib/api"
import { useWallet } from "./use-wallet"

export function useOrders() {
  const { authenticated } = useWallet()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authenticated) {
      setOrders([])
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchOrders()
        if (!cancelled) setOrders(data)
      } catch {
        if (!cancelled) setOrders([])
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

  return { orders, loading }
}

export function usePendingOrders() {
  const { orders, loading } = useOrders()
  const pending = orders.filter(
    (o) => o.status === "pending" || o.status === "funded" || o.status === "processing",
  )
  return { orders: pending, loading }
}
