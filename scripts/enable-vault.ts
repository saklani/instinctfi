/**
 * Enable LP (public deposits) and automation on a vault.
 *
 * Usage:
 *   PRIVATE_KEY="$(cat ~/.config/solana/id.json)" bun run scripts/enable-vault.ts <vault_address>
 */

import { Connection, Keypair } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = process.env.RPC_URL!
const vaultAddress = process.argv[2]

if (!vaultAddress) {
  console.error("Usage: bun run scripts/enable-vault.ts <vault_address>")
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
    signTransaction: async <T>(tx: T): Promise<T> => { (tx as any).sign([keypair]); return tx },
    signAllTransactions: async <T>(txs: T[]): Promise<T[]> => { txs.forEach((tx: any) => tx.sign([keypair])); return txs },
    payer: keypair,
  }
}

async function main() {
  const keypair = loadKeypair()
  const wallet = createWallet(keypair)
  const connection = new Connection(RPC_URL, "confirmed")
  const sdk = new SymmetryCore({ connection, network: "mainnet", priorityFee: 100_000 })

  const vault = await sdk.fetchVault(vaultAddress)
  console.log("Vault:", vault.formatted?.name)
  console.log("Current vault_type:", vault.formatted?.vault_type)
  console.log("Current lp_settings:", JSON.stringify(vault.formatted?.lp_settings))
  console.log("Current automation_settings:", JSON.stringify(vault.formatted?.automation_settings))

  const ctx = { vault: vaultAddress, manager: wallet.publicKey.toBase58() }

  // Enable LP (makes vault public)
  console.log("\n1. Enabling LP settings...")
  const lpTx = await sdk.openVaultIntentTx({
    context: ctx,
    type: 6, // EditLpSettings
    settings: {
      enabled: true,
      lp_threshold_bps: 0,
      modification_delay: 0,
    },
  })
  await sdk.signAndSendTxPayloadBatchSequence({ txPayloadBatchSequence: lpTx, wallet })
  console.log("   LP enabled")

  // Execute LP intent
  const intents = await sdk.fetchVaultIntents(vaultAddress)
  if (intents.length > 0) {
    const intent = (intents[0] as any).chain_data?.ownAddress?.toBase58() ?? (intents[0] as any).formatted?.pubkey
    if (intent) {
      console.log("   Executing intent:", intent)
      const execTx = await sdk.executeVaultIntentTx({ keeper: wallet.publicKey.toBase58(), intent })
      await sdk.signAndSendTxPayloadBatchSequence({ txPayloadBatchSequence: execTx, wallet })
      console.log("   Intent executed")
    }
  }

  // Enable automation
  console.log("\n2. Enabling automation settings...")
  const autoTx = await sdk.openVaultIntentTx({
    context: ctx,
    type: 5, // EditAutomationSettings
    settings: {
      enabled: true,
      rebalance_slippage_threshold_bps: 500,
      per_trade_rebalance_slippage_threshold_bps: 500,
      rebalance_activation_threshold_abs_bps: 100,
      rebalance_activation_threshold_rel_bps: 100,
      rebalance_activation_cooldown: 300,
      modification_delay: 0,
    },
  })
  await sdk.signAndSendTxPayloadBatchSequence({ txPayloadBatchSequence: autoTx, wallet })
  console.log("   Automation enabled")

  // Execute automation intent
  const intents2 = await sdk.fetchVaultIntents(vaultAddress)
  if (intents2.length > 0) {
    const intent = (intents2[0] as any).chain_data?.ownAddress?.toBase58() ?? (intents2[0] as any).formatted?.pubkey
    if (intent) {
      console.log("   Executing intent:", intent)
      const execTx = await sdk.executeVaultIntentTx({ keeper: wallet.publicKey.toBase58(), intent })
      await sdk.signAndSendTxPayloadBatchSequence({ txPayloadBatchSequence: execTx, wallet })
      console.log("   Intent executed")
    }
  }

  // Verify
  const updated = await sdk.fetchVault(vaultAddress)
  console.log("\nUpdated:")
  console.log("  vault_type:", updated.formatted?.vault_type)
  console.log("  lp_settings:", JSON.stringify(updated.formatted?.lp_settings))
  console.log("  automation_settings:", JSON.stringify(updated.formatted?.automation_settings))
}

main().catch(console.error)
