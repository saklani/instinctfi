import { request } from "@/lib/api"

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

export function fetchStocks(): Promise<Stock[]> {
  return request("/api/stocks")
}
