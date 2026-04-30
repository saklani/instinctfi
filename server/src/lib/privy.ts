import { PrivyClient } from "@privy-io/server-auth"
import { db } from "../db"
import { wallets } from "../db/schema"
import { eq } from "drizzle-orm"

export const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
)

const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" as const

export async function getOrCreateUserWallet(userId: string) {
  const [existing] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1)

  if (existing) {
    return { walletId: existing.walletId, address: existing.address }
  }

  const wallet = await privy.walletApi.createWallet({
    chainType: "solana",
  })

  await db.insert(wallets).values({
    userId,
    walletId: wallet.id,
    address: wallet.address,
  })

  return { walletId: wallet.id, address: wallet.address }
}

export async function signAndSendTransaction(
  walletId: string,
  transactionBase64: string,
) {
  return privy.walletApi.solana.signAndSendTransaction({
    walletId,
    caip2: SOLANA_MAINNET_CAIP2,
    transaction: transactionBase64 as any,
  })
}

export async function signTransaction(
  walletId: string,
  transactionBase64: string,
) {
  return privy.walletApi.solana.signTransaction({
    walletId,
    transaction: transactionBase64 as any,
  })
}
