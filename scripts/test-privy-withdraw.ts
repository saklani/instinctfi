/**
 * Withdraw vault tokens back to USDC via Privy server wallet.
 *
 * Usage:
 *   bun run scripts/test-privy-withdraw.ts [amount]
 *
 * If no amount specified, withdraws all vault tokens.
 */

import { Connection, PublicKey } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"
import { PrivyClient } from "@privy-io/node"

const RPC_URL = process.env.RPC_URL!
const VAULT_MINT = "FXcxe5f3AwkJZRaoYFuGME7rEXS4NmBxZPYKVh3Q4bnD"
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const WALLET_ID = "m0vnd6lzap3uj691921zs0nx"

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

async function main() {
  const connection = new Connection(RPC_URL, "confirmed")

  console.log("Fetching wallet info...")
  const wallet = await privy.wallets().get(WALLET_ID)
  const walletAddress = wallet.address
  const walletPk = new PublicKey(walletAddress)
  console.log("Wallet:", walletAddress)

  // Check vault token balance
  const { value: vaultAccounts } = await connection.getParsedTokenAccountsByOwner(
    walletPk, { mint: new PublicKey(VAULT_MINT) },
  )
  const vaultTokenBalance = vaultAccounts[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0
  console.log("Vault token balance:", vaultTokenBalance)

  if (vaultTokenBalance <= 0) {
    console.error("No vault tokens to withdraw")
    return
  }

  // Check USDC before
  const { value: usdcAccounts } = await connection.getParsedTokenAccountsByOwner(
    walletPk, { mint: new PublicKey(USDC_MINT) },
  )
  const usdcBefore = usdcAccounts[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0
  console.log("USDC before:", usdcBefore)

  const withdrawAmount = parseFloat(process.argv[2] ?? String(vaultTokenBalance))
  const rawAmount = Math.floor(withdrawAmount * 1e6)
  console.log("Withdrawing:", withdrawAmount, "vault tokens")

  // Sell
  console.log("\n=== Sell ===")
  const sdk = new SymmetryCore({ connection, network: "mainnet", priorityFee: 100_000 })

  const sellPayload = await sdk.sellVaultTx({
    seller: walletAddress,
    vault_mint: VAULT_MINT,
    withdraw_amount: rawAmount,
    keep_tokens: [USDC_MINT],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  for (const batch of sellPayload.batches) {
    for (const tx of batch.transactions) {
      const sig = await signAndSend(connection, tx.tx_b64)
      console.log(`  ${sig.slice(0, 20)}...`)
    }
  }

  console.log("\nWithdraw submitted. Run keeper to process, then check USDC balance.")
}

main().catch(console.error)
