import { request } from "@/lib/api"

export interface Order {
  id: string
  vaultId: string
  type: "deposit" | "withdraw"
  amount: string
  status: "pending" | "funded" | "processing" | "completed" | "failed" | "cancelled"
  signature: string | null
  createdAt: string
}

export function fetchOrders(): Promise<Order[]> {
  return request("/api/orders")
}

export function createDeposit(params: {
  vaultId: string
  signature: string
  address: string
}): Promise<Order> {
  return request("/api/orders/deposit", {
    method: "POST",
    body: JSON.stringify(params),
  })
}
