import { useQuery } from "@tanstack/react-query"
import { fetchOrders } from "../api"
import { useWallet } from "@/hooks/use-wallet"

export function useOrders() {
  const { authenticated } = useWallet()

  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    enabled: authenticated,
    refetchInterval: 15_000,
  })

  return { orders: data ?? [], loading: isLoading }
}

export function usePendingOrders() {
  const { orders, loading } = useOrders()

  const pending = orders.filter(
    (o) =>
      o.status === "pending" ||
      o.status === "funded" ||
      o.status === "processing",
  )

  return { orders: pending, loading }
}
