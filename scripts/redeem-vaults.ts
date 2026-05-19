/**
 * Redeem all vault tokens in a wallet back to USDC via Symmetry.
 *
 * Usage:
 *   bun run scripts/redeem-vaults.ts
 *
 * Targets NOT INSIDER TRADING + REVERSE CHAMATH for wallet m0vnd6lzap3uj691921zs0nx.
 */

import { Connection, PublicKey } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"
import { PrivyClient } from "@privy-io/node"

const RPC_URL = process.env.RPC_URL!
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const SOL_MINT  = "So11111111111111111111111111111111111111112"
const WALLET_ID = "m0vnd6lzap3uj691921zs0nx"

const VAULTS = [
  { label: "NOT INSIDER TRADING", mint: "FXcxe5f3AwkJZRaoYFuGME7rEXS4NmBxZPYKVh3Q4bnD", keep: [USDC_MINT] },
  { label: "REVERSE CHAMATH",     mint: "C8nquiV3ZLwbh3d3hBgPyYaKM5tKvYyS15u2fLPmcfV9", keep: [SOL_MINT] },
]

const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
})

async function signAndSend(connection: Connection, txBase64: string): Promise<string> {
  const { signed_transaction } = await privy.wallets().solana().signTransaction(WALLET_ID, {
    transaction: txBase64,
  })
  const sig = await connection.sendRawTransaction(Buffer.from(signed_transaction, "base64"))
  await connection.confirmTransaction(sig, "confirmed")
  return sig
}

async function rawBalance(connection: Connection, owner: PublicKey, mint: string): Promise<bigint> {
  const { value } = await connection.getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(mint) })
  const amt = value[0]?.account.data.parsed.info.tokenAmount.amount
  return amt ? BigInt(amt) : 0n
}

async function uiBalance(connection: Connection, owner: PublicKey, mint: string): Promise<number> {
  const { value } = await connection.getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(mint) })
  return value[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed")
  const wallet = await privy.wallets().get(WALLET_ID)
  const owner = new PublicKey(wallet.address)
  console.log("Wallet:", wallet.address)

  const usdcBefore = await uiBalance(connection, owner, USDC_MINT)
  console.log("USDC before:", usdcBefore)

  const sdk = new SymmetryCore({ connection, network: "mainnet", priorityFee: 100_000 })

  for (const { label, mint, keep } of VAULTS) {
    console.log(`\n=== ${label} (${mint}) ===`)
    const raw = await rawBalance(connection, owner, mint)
    if (raw <= 0n) {
      console.log("  no balance, skipping")
      continue
    }
    const ui = await uiBalance(connection, owner, mint)
    console.log(`  balance: ${ui} (raw ${raw})`)

    const sellPayload = await sdk.sellVaultTx({
      seller: wallet.address,
      vault_mint: mint,
      withdraw_amount: Number(raw),
      keep_tokens: keep,
      rebalance_slippage_bps: 500,
      per_trade_rebalance_slippage_bps: 500,
    })

    for (const batch of sellPayload.batches) {
      for (const tx of batch.transactions) {
        const sig = await signAndSend(connection, tx.tx_b64)
        console.log(`  sent: ${sig}`)
      }
    }
  }

  const usdcAfter = await uiBalance(connection, owner, USDC_MINT)
  console.log("\nUSDC after:", usdcAfter, "(delta:", usdcAfter - usdcBefore, ")")
  console.log("Note: redemptions may need keeper to process before USDC settles.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
