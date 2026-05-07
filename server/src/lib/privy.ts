import { PrivyClient } from "@privy-io/node"

export const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
})

const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"

function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }

  return value
}

export function getTreasuryWallet() {
  return {
    walletId: requireEnv("TREASURY_WALLET_ID"),
    address: requireEnv("TREASURY_WALLET_ADDRESS"),
  }
}

export async function signAndSendTransaction(
  walletId: string,
  transactionBase64: string,
) {
  return privy.wallets().solana().signAndSendTransaction(walletId, {
    caip2: SOLANA_MAINNET_CAIP2,
    transaction: transactionBase64,
  })
}

export async function signTransaction(
  walletId: string,
  transactionBase64: string,
) {
  return privy.wallets().solana().signTransaction(walletId, {
    transaction: transactionBase64,
  })
}
