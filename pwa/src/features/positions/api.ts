import { request } from "@/lib/api"

export interface Position {
  id: string
  vaultId: string
  shares: string
  amount: string
}

export function fetchPositions(): Promise<Position[]> {
  return request("/api/positions")
}
