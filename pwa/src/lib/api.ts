const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

let getAccessToken: (() => Promise<string | null>) | null = null

export function setAccessTokenGetter(fn: () => Promise<string | null>) {
  getAccessToken = fn
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken ? await getAccessToken() : null

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `API error ${res.status}`)
  }

  return res.json()
}

// ── Vaults ──────────────────────────────────────────────

export interface Vault {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  vaultAddress: string
  vaultMint: string
  composition: { stockId: string; weightBps: number }[]
  depositFeeBps: number
  withdrawFeeBps: number
  tvl: string | null
  price: string | null
  supply: number
  onChainComposition?: { mint: string; weight: number; amount: number }[]
}

export function fetchVaults(): Promise<Vault[]> {
  return request("/api/vaults")
}

export function fetchVault(id: string): Promise<Vault> {
  return request(`/api/vaults/${id}`)
}

// ── Stocks ──────────────────────────────────────────────

export interface Stock {
  id: string
  name: string
  ticker: string
  symbol: string
  description: string | null
  mint: string
}

export function fetchStocks(): Promise<Stock[]> {
  return request("/api/stocks")
}

// ── Orders ──────────────────────────────────────────────

export interface Order {
  id: string
  vaultId: string
  type: "deposit" | "withdraw"
  amountUsdc: string
  status: "pending" | "funded" | "processing" | "completed" | "failed" | "cancelled"
  depositAddress?: string
  createdAt: string
}

export function fetchOrders(): Promise<Order[]> {
  return request("/api/orders")
}

export function createOrder(params: {
  vaultId: string
  type: "deposit" | "withdraw"
  amountUsdc: string
}): Promise<Order & { depositAddress: string }> {
  return request("/api/orders", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export function confirmOrder(orderId: string): Promise<{ status: string }> {
  return request(`/api/orders/${orderId}/confirm`, {
    method: "POST",
  })
}

// ── Positions ───────────────────────────────────────────

export interface Position {
  id: string
  vaultId: string
  shares: string
  costBasisUsdc: string
}

export function fetchPositions(): Promise<Position[]> {
  return request("/api/positions")
}
