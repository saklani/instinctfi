import { PrivyClient } from "@privy-io/node"
import { db } from "../db/index.js"
import { wallets } from "../db/schema.js"
import { eq } from "drizzle-orm"

export const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
})

const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"

export async function getOrCreateUserWallet(userId: string) {
  const [existing] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1)

  if (existing) {
    return { walletId: existing.walletId, address: existing.address }
  }

  const wallet = await privy.wallets().create({
    chain_type: "solana",
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
