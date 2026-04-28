import { Connection } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = "https://api.devnet.solana.com"
const NETWORK = "devnet" as const
const SOL_MINT = "So11111111111111111111111111111111111111112"

let sdk: SymmetryCore | null = null

export function getSDK() {
  if (!sdk) {
    const connection = new Connection(RPC_URL, "confirmed")
    sdk = new SymmetryCore({
      connection,
      network: NETWORK,
      priorityFee: 50_000,
    })
  }
  return sdk
}

export function getConnection() {
  return new Connection(RPC_URL, "confirmed")
}

export async function fetchVaultData(vaultAddress: string) {
  const sdk = getSDK()
  let vault = await sdk.fetchVault(vaultAddress)
  vault = await sdk.loadVaultPrice(vault)
  return vault
}

export async function investInVault(params: {
  buyerAddress: string
  vaultMint: string
  amountLamports: number
  wallet: any
}) {
  const sdk = getSDK()

  console.log("[invest] Building buy tx...", {
    buyer: params.buyerAddress,
    vault_mint: params.vaultMint,
    amount: params.amountLamports,
  })

  // 1. Build buy transaction
  const buyTx = await sdk.buyVaultTx({
    buyer: params.buyerAddress,
    vault_mint: params.vaultMint,
    contributions: [
      { mint: SOL_MINT, amount: params.amountLamports },
    ],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })

  console.log("[invest] Signing and sending buy tx...")

  // 2. Sign and send — skip simulation since devnet can be flaky
  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: buyTx,
    wallet: params.wallet,
    simulateTransactions: false,
  })

  console.log("[invest] Buy tx sent. Building lock tx...")

  // 3. Lock deposits
  const lockTx = await sdk.lockDepositsTx({
    buyer: params.buyerAddress,
    vault_mint: params.vaultMint,
  })

  console.log("[invest] Signing and sending lock tx...")

  // 4. Sign and send lock
  await sdk.signAndSendTxPayloadBatchSequence({
    txPayloadBatchSequence: lockTx,
    wallet: params.wallet,
    simulateTransactions: false,
  })

  console.log("[invest] Done!")
}
