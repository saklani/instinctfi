import { Connection, VersionedTransaction } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"
import bs58 from "bs58"

const RPC_URL =
  import.meta.env.VITE_RPC_URL ?? "https://api.mainnet-beta.solana.com"
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const CONFIRM_TIMEOUT_MS = 60_000
const CONFIRM_POLL_MS = 1_500

let sdk: SymmetryCore | null = null
const connection = new Connection(RPC_URL, "confirmed")

function getSDK() {
  if (!sdk) {
    sdk = new SymmetryCore({
      connection,
      network: "mainnet",
      priorityFee: 100_000,
    })
  }
  return sdk
}

/**
 * Caller-supplied signer. Wraps whatever wallet API the app uses (Privy's
 * `useSignAndSendTransaction`, a wallet adapter, etc.) — keeps this module
 * free of Privy types.
 */
export type Signer = (tx: Uint8Array) => Promise<{ signature: Uint8Array }>

function extractTransactions(payload: unknown): VersionedTransaction[] {
  const txs: VersionedTransaction[] = []
  const batches = (payload as { batches: { transactions: { tx_b64: string }[] }[] }).batches
  for (const batch of batches) {
    for (const tx of batch.transactions) {
      txs.push(VersionedTransaction.deserialize(Buffer.from(tx.tx_b64, "base64")))
    }
  }
  return txs
}

async function waitForConfirmation(signature: string) {
  const start = Date.now()
  while (Date.now() - start < CONFIRM_TIMEOUT_MS) {
    const { value } = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: false,
    })
    if (value?.err) {
      throw new Error(`Transaction ${signature} failed: ${JSON.stringify(value.err)}`)
    }
    if (
      value?.confirmationStatus === "confirmed" ||
      value?.confirmationStatus === "finalized"
    ) {
      return
    }
    await new Promise((r) => setTimeout(r, CONFIRM_POLL_MS))
  }
  throw new Error(`Transaction ${signature} did not confirm within ${CONFIRM_TIMEOUT_MS / 1000}s`)
}

async function signSendAndConfirm(signer: Signer, tx: VersionedTransaction): Promise<string> {
  const { signature: sigBytes } = await signer(tx.serialize())
  const signature = bs58.encode(sigBytes)
  await waitForConfirmation(signature)
  return signature
}

export async function fetchVaultData(vaultAddress: string) {
  const sdk = getSDK()
  let vault = await sdk.fetchVault(vaultAddress)
  vault = await sdk.loadVaultPrice(vault)
  return vault
}

/**
 * Symmetry deposit flow: buyVaultTx creates a rebalance intent, then
 * lockDepositsTx kicks off the auction. Each tx is confirmed on-chain before
 * the next one is submitted — `lockDepositsTx` depends on the buy intent
 * existing, so race-then-fail is the typical failure mode without this.
 */
export async function investInVault(params: {
  buyerAddress: string
  vaultMint: string
  amountLamports: number
  signer: Signer
}): Promise<string[]> {
  const sdk = getSDK()
  const signatures: string[] = []

  const buyPayload = await sdk.buyVaultTx({
    buyer: params.buyerAddress,
    vault_mint: params.vaultMint,
    contributions: [{ mint: USDC_MINT, amount: params.amountLamports }],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })
  for (const tx of extractTransactions(buyPayload)) {
    signatures.push(await signSendAndConfirm(params.signer, tx))
  }

  const lockPayload = await sdk.lockDepositsTx({
    buyer: params.buyerAddress,
    vault_mint: params.vaultMint,
  })
  for (const tx of extractTransactions(lockPayload)) {
    signatures.push(await signSendAndConfirm(params.signer, tx))
  }

  return signatures
}

export async function redeemFromVault(params: {
  sellerAddress: string
  vaultMint: string
  shares: number
  signer: Signer
}): Promise<string[]> {
  const sdk = getSDK()
  const signatures: string[] = []

  const sellPayload = await sdk.sellVaultTx({
    seller: params.sellerAddress,
    vault_mint: params.vaultMint,
    withdraw_amount: params.shares,
    keep_tokens: [USDC_MINT],
    rebalance_slippage_bps: 500,
    per_trade_rebalance_slippage_bps: 500,
  })
  for (const tx of extractTransactions(sellPayload)) {
    signatures.push(await signSendAndConfirm(params.signer, tx))
  }

  return signatures
}
