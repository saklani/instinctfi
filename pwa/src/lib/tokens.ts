export const TOKEN_META: Record<string, { symbol: string; name: string }> = {
  So11111111111111111111111111111111111111112: { symbol: "SOL", name: "Solana" },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: "USDC", name: "USD Coin" },
  Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh: { symbol: "NVDAx", name: "Nvidia" },
  XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN: { symbol: "GOOGLx", name: "Alphabet" },
  Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg: { symbol: "AMZNx", name: "Amazon" },
  XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp: { symbol: "AAPLx", name: "Apple" },
  Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu: { symbol: "METAx", name: "Meta" },
  XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4: { symbol: "PLTRx", name: "Palantir" },
  XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX: { symbol: "MSFTx", name: "Microsoft" },
  XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB: { symbol: "TSLAx", name: "Tesla" },
}

export function getTokenMeta(mint: string) {
  return TOKEN_META[mint] ?? { symbol: mint.slice(0, 6), name: "Unknown" }
}
