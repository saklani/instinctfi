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

// ── Auth ────────────────────────────────────────────────

export interface AuthResponse {
  userId: string
  address: string
}

export function authenticate(address: string): Promise<AuthResponse> {
  return request("/api/auth", {
    method: "POST",
    body: JSON.stringify({ address }),
  })
}

// ── Treasury ────────────────────────────────────────────

export interface Treasury {
  address: string
}

export function getTreasury(): Promise<Treasury> {
  return request("/api/treasury")
}
