/**
 * Step 2: Add a single token to the vault
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/mainnet/2-add-token.ts <vault_address> <token_mint> <pyth_account>
 *
 * Example:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/mainnet/2-add-token.ts G54nsrBx... Xsc9qvGR... 2w1Tg1XT...
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=7ab8b174-ab40-4c2a-aef7-93a19dbd364c"

const vaultAddress = process.argv[2]
const tokenMint = process.argv[3]
const pythAccount = process.argv[4]

if (!vaultAddress || !tokenMint || !pythAccount) {
  console.error("Usage: bun run scripts/mainnet/2-add-token.ts <vault> <mint> <pyth>")
  process.exit(1)
}

function loadKeypair(): Keypair {
  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error("Set PRIVATE_KEY env var")
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(pk)))
}

function createWallet(keypair: Keypair) {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async <T>(tx: T): Promise<T> => {
      ;(tx as any).sign([keypair])
      return tx
    },
    signAllTransactions: async <T>(txs: T[]): Promise<T[]> => {
      txs.forEach((tx: any) => tx.sign([keypair]))
      return txs
    },
    payer: keypair,
  }
}

async function main() {
  const keypair = loadKeypair()
  const wallet = createWallet(keypair)
  const connection = new Connection(RPC_URL, "confirmed")

  console.log("Wallet:", keypair.publicKey.toBase58())
  console.log("Vault:", vaultAddress)
  console.log("Token:", tokenMint)
  console.log("Pyth:", pythAccount)

  const sdk = new SymmetryCore({ connection, network: "mainnet", priorityFee: 100_000 })

  // Verify vault exists
  const vault = await sdk.fetchVault(vaultAddress)
  console.log("Vault name:", vault.formatted?.name)

  console.log("\nAdding token...")
  const addTx = await sdk.addOrEditTokenTx(
    { vault: vaultAddress, manager: wallet.publicKey.toBase58() },
    {
      token_mint: tokenMint,
      active: true,
      min_oracles_thresh: 1,
      min_conf_bps: 10,
      conf_thresh_bps: 200,
      conf_multiplier: 1.0,
      oracles: [{
        oracle_type: "pyth" as const,
        account_lut_id: 0,
        account_lut_index: 0,
        account: pythAccount,
        weight_bps: 10000,
        is_required: true,
        conf_thresh_bps: 200,
        volatility_thresh_bps: 200,
        max_slippage_bps: 1000,
        min_liquidity: 0,
        staleness_thresh: 120,
        staleness_conf_rate_bps: 50,
        token_decimals: 8,
        twap_seconds_ago: 0,
        twap_secondary_seconds_ago: 0,
        quote_token: "usd" as const,
        min_conf_bps: 10,
        conf_multiplier: 1.0,
      }],
    },
  )

  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: addTx,
    wallet,
  })

  console.log("Token added!")
}

main().catch(console.error)
