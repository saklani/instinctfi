import { create } from "zustand"

interface AppState {
  walletAddress: string | null
  setWallet: (address: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  walletAddress: null,
  setWallet: (address) => set({ walletAddress: address }),
}))
