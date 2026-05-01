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

// ── Auth ────────────────────────────────────────────────

export interface AuthResponse {
  userId: string
  walletAddress: string
  treasuryWalletAddress: string
}

export function authenticate(): Promise<AuthResponse> {
  return request("/api/auth", { method: "POST" })
}

// ── Vaults ──────────────────────────────────────────────

export interface Stock {
  id: string
  name: string
  ticker: string
  imageUrl: string
  description: string | null
  address: string
  decimals: number
}

export interface VaultComposition {
  weightBps: number
  stock: Stock
}

export interface Vault {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  vaultAddress: string
  vaultMint: string
  depositFeeBps: number
  withdrawFeeBps: number
  compositions: VaultComposition[]
}

export function fetchVaults(): Promise<Vault[]> {
  return request("/api/vaults")
}

export function fetchVault(id: string): Promise<Vault> {
  return request(`/api/vaults/${id}`)
}

// ── Stocks ──────────────────────────────────────────────

export function fetchStocks(): Promise<Stock[]> {
  return request("/api/stocks")
}

// ── Orders ──────────────────────────────────────────────

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

// ── Positions ───────────────────────────────────────────

export interface Position {
  id: string
  vaultId: string
  shares: string
  amount: string
}

export function fetchPositions(): Promise<Position[]> {
  return request("/api/positions")
}
