// Devnet token metadata — swap to xStock mints for mainnet
export const TOKEN_META: Record<
  string,
  { symbol: string; name: string }
> = {
  So11111111111111111111111111111111111111112: {
    symbol: "SOL",
    name: "Solana",
  },
  USDCoctVLVnvTXBEuP9s8hntucdJokbo17RwHuNXemT: {
    symbol: "USDC",
    name: "USD Coin",
  },
}

export function getTokenMeta(mint: string) {
  return TOKEN_META[mint] ?? { symbol: mint.slice(0, 6), name: "Unknown" }
}
