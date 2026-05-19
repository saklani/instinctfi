const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

let getAccessToken: (() => Promise<string | null>) | null = null

export function setAccessTokenGetter(fn: () => Promise<string | null>) {
  getAccessToken = fn
}

export async function request<T>(
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

// ── Types ───────────────────────────────────────────────

export interface AuthResponse {
  userId: string
  instinctAddress: string
  connectedAddress: string
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"

export type SwapLegResult =
  | {
      mint: string
      weight: number
      ok: true
      signature: string
      inAtomic: string
      outAtomic: string
      maker: string | null
      router: string
    }
  | {
      mint: string
      weight: number
      ok: false
      reason: string
      detail: string
    }

export interface Order {
  id: string
  userId: string
  vaultId: string
  type: "deposit" | "withdraw"
  amount: string
  status: OrderStatus
  result: SwapLegResult[]
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface PortfolioBasketRow {
  mint: string
  ticker: string | null
  atomic: string
  uiAmount: number
  usdPrice: number | null
  usdValue: number
}

export interface PortfolioVaultPosition {
  vault: {
    id: string
    name: string
    description: string | null
    imageUrl: string
  }
  investedUsdc: number
  currentValueUsdc: number
  pnlUsdc: number
  pnlPct: number
  basket: PortfolioBasketRow[]
}

export interface Portfolio {
  totalInvestedUsdc: number
  totalCurrentValueUsdc: number
  totalPnlUsdc: number
  vaults: PortfolioVaultPosition[]
}

// ── Calls ───────────────────────────────────────────────

export function authenticate(params: {
  connectedAddress: string
  connectedClientType: "privy" | "external"
}): Promise<AuthResponse> {
  return request("/api/auth", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export function depositOrder(params: {
  vaultId: string
  signature: string
  amountUsdc: string
}): Promise<Order> {
  return request("/api/orders/deposit", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export function getOrder(id: string): Promise<Order> {
  return request(`/api/orders/${id}`)
}

export function getOrders(): Promise<Order[]> {
  return request(`/api/orders`)
}

export function getPortfolio(): Promise<Portfolio> {
  return request(`/api/portfolio`)
}
