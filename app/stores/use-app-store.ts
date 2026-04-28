import { create } from "zustand"
import { IndexFund, Position } from "@/types"
import { MOCK_INDEX_FUNDS } from "@/data/mock-funds"

interface AppState {
  // User
  walletAddress: string | null
  usdcBalance: number
  isAuthenticated: boolean

  // Funds
  funds: IndexFund[]

  // Positions
  positions: Position[]

  // Actions
  setWallet: (address: string | null) => void
  setAuthenticated: (value: boolean) => void
  setUsdcBalance: (balance: number) => void
  addPosition: (position: Position) => void
  removePosition: (fundId: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  walletAddress: null,
  usdcBalance: 1000,
  isAuthenticated: false,

  funds: MOCK_INDEX_FUNDS,
  positions: [],

  setWallet: (address) => set({ walletAddress: address }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setUsdcBalance: (balance) => set({ usdcBalance: balance }),
  addPosition: (position) =>
    set((state) => ({ positions: [...state.positions, position] })),
  removePosition: (fundId) =>
    set((state) => ({
      positions: state.positions.filter((p) => p.fundId !== fundId),
    })),
}))
