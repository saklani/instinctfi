export interface IndexFund {
  id: string
  name: string
  symbol: string
  description: string
  holdings: Holding[]
  totalValue: number
  sharePrice: number
  totalSupply: number
  performance24h: number
  performance7d: number
  performance30d: number
  managerFee: number
  rebalanceInterval: number
  category: "tech" | "broad" | "sector" | "custom"
  logoUrl?: string
}

export interface Holding {
  mint: string
  symbol: string
  name: string
  targetWeight: number
  currentWeight: number
  price: number
  quantity: number
  change24h: number
  logoUrl?: string
}

export interface Position {
  fundId: string
  fund: IndexFund
  shares: number
  avgPrice: number
  currentValue: number
  pnl: number
  pnlPercent: number
}

export interface XStock {
  mint: string
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  logoUrl?: string
}

export interface UserState {
  walletAddress: string | null
  usdcBalance: number
  positions: Position[]
  isAuthenticated: boolean
}
