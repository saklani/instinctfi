import { useQuery } from "@tanstack/react-query"
import { getOrders, type Order } from "@/lib/api"
import { useWallet } from "./use-wallet"

export function useOrders() {
  const { authenticated } = useWallet()
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: authenticated,
    refetchInterval: 15_000,
  })
  return { orders: (data ?? []) as Order[], loading: isLoading }
}

export function usePendingOrders() {
  const { orders, loading } = useOrders()
  const pending = orders.filter(
    (o) => o.status === "pending" || o.status === "processing",
  )
  return { orders: pending, loading }
}
