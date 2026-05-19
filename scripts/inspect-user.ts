/**
 * Read-only: resolve Privy user -> Solana wallet ID + on-chain vault holdings.
 * No signing. Just inspection.
 */

import { Connection, PublicKey } from "@solana/web3.js"
import { PrivyClient } from "@privy-io/node"

const USER_ID = process.argv[2]
const EXPECTED_ADDRESS = process.argv[3]

if (!USER_ID) {
  console.error("Usage: bun run scripts/inspect-user.ts <privy_user_id> [expected_solana_address]")
  process.exit(1)
}

const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
})

const connection = new Connection(process.env.RPC_URL!, "confirmed")

async function main() {
  console.log("=== Privy user ===")
  const user = await privy.users().get(USER_ID)
  console.log("id:", user.id)
  console.log("linked accounts:")
  for (const acc of user.linked_accounts ?? []) {
    console.log(" -", JSON.stringify(acc))
  }

  const solanaWallets = (user.linked_accounts ?? []).filter(
    (a: any) => a.type === "wallet" && a.chain_type === "solana",
  )
  console.log("\nSolana wallets:", solanaWallets.length)
  for (const w of solanaWallets as any[]) {
    console.log(" - wallet_id:", w.id, "address:", w.address, "client:", w.wallet_client_type, "delegated:", w.delegated)
  }

  const target = EXPECTED_ADDRESS
    ? (solanaWallets as any[]).find((w) => w.address === EXPECTED_ADDRESS)
    : (solanaWallets[0] as any)

  if (!target) {
    console.error("\nNo matching Solana wallet")
    return
  }

  console.log("\n=== On-chain holdings for", target.address, "===")
  const owner = new PublicKey(target.address)
  const { value: accounts } = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  })

  for (const acc of accounts) {
    const info: any = acc.account.data.parsed.info
    const amt = info.tokenAmount.uiAmount
    if (!amt) continue
    console.log(" -", info.mint, "amount:", amt)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
