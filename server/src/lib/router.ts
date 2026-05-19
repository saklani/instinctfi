import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js"
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token"

import { privy } from "./privy.js"

const JUPITER_URL = "https://api.jup.ag/swap/v2"
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
const USDC_DECIMALS = 6

// Jupiter routes freely — JupiterZ RFQ when an MM quotes, Metis/OKX aggregator
// otherwise. Either way the order returns with a deterministic outAmount and
// a signable tx (with treasury as fee payer when set).

export type QuoteParams = {
  walletAddress: string
  inputMint: string
  outputMint: string
  amount: bigint
}

export type Quote = {
  ok: true
  transaction: string
  requestId: string
  outAmount: string
  router: string
  maker: string | null
  lastValidBlockHeight: number | null
  signatureFeePayer: string | null
  prioritizationFeePayer: string | null
  rentFeePayer: string | null
}

export type QuoteResult =
  | Quote
  | { ok: false; reason: "no_route"; detail: string }

export type ExecuteResult =
  | {
      ok: true
      signature: string
      inAtomic: string
      outAtomic: string
      maker: string | null
      router: string
    }
  | {
      ok: false
      reason: "sign_failed" | "execute_failed"
      detail: string
    }

type JupiterOrderResponse = {
  transaction: string
  requestId: string
  outAmount: string
  router: string
  maker?: string
  lastValidBlockHeight?: number
  signatureFeePayer?: string
  prioritizationFeePayer?: string
  rentFeePayer?: string
}

type JupiterExecuteResponse = {
  status: "Success" | "Failed"
  signature?: string
  code?: number
  inputAmountResult?: string
  outputAmountResult?: string
  error?: string
}

function apiKey() {
  const key = process.env.JUPITER_API_KEY
  if (!key) throw new Error("JUPITER_API_KEY not set")
  return key
}

let cachedTreasuryAddress: string | null = null

export async function getTreasuryAddress(): Promise<string | null> {
  if (cachedTreasuryAddress) return cachedTreasuryAddress
  const walletId = process.env.TREASURY_WALLET_ID
  if (!walletId) return null
  const wallet = await privy.wallets().get(walletId)
  cachedTreasuryAddress = wallet.address
  return wallet.address
}

/**
 * Phase 1 of a swap: get a Jupiter order (quote + unsigned tx). Does NOT sign
 * or execute. Returned `Quote` is passed to `executeQuoted` later.
 */
export async function quoteSwap(params: QuoteParams): Promise<QuoteResult> {
  const treasuryAddress = await getTreasuryAddress()

  const orderUrl = new URL(`${JUPITER_URL}/order`)
  orderUrl.searchParams.set("inputMint", params.inputMint)
  orderUrl.searchParams.set("outputMint", params.outputMint)
  orderUrl.searchParams.set("amount", params.amount.toString())
  orderUrl.searchParams.set("taker", params.walletAddress)
  if (treasuryAddress) {
    orderUrl.searchParams.set("payer", treasuryAddress)
  }

  const orderRes = await fetch(orderUrl, {
    headers: { "x-api-key": apiKey() },
  })

  if (!orderRes.ok) {
    return {
      ok: false,
      reason: "no_route",
      detail: `${orderRes.status} ${await orderRes.text()}`,
    }
  }

  const o = (await orderRes.json()) as JupiterOrderResponse
  return {
    ok: true,
    transaction: o.transaction,
    requestId: o.requestId,
    outAmount: o.outAmount,
    router: o.router,
    maker: o.maker ?? null,
    lastValidBlockHeight: o.lastValidBlockHeight ?? null,
    signatureFeePayer: o.signatureFeePayer ?? null,
    prioritizationFeePayer: o.prioritizationFeePayer ?? null,
    rentFeePayer: o.rentFeePayer ?? null,
  }
}

/**
 * Phase 2: sign the quoted tx (treasury first if it's a fee payer, then the
 * Instinct wallet) and submit via Jupiter `/execute`. Returns realized
 * atomic amounts from Jupiter's response.
 */
export async function executeQuoted(
  quote: Quote,
  walletId: string,
): Promise<ExecuteResult> {
  const treasuryWalletId = process.env.TREASURY_WALLET_ID
  const treasuryAddress = await getTreasuryAddress()
  let signedBase64 = quote.transaction

  const treasuryIsSigner =
    treasuryAddress &&
    (quote.signatureFeePayer === treasuryAddress ||
      quote.prioritizationFeePayer === treasuryAddress ||
      quote.rentFeePayer === treasuryAddress)

  if (treasuryIsSigner && treasuryWalletId) {
    try {
      const result = await privy
        .wallets()
        .solana()
        .signTransaction(treasuryWalletId, { transaction: signedBase64 })
      signedBase64 = result.signed_transaction
    } catch (e) {
      return {
        ok: false,
        reason: "sign_failed",
        detail: `treasury sign failed: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }

  try {
    const result = await privy
      .wallets()
      .solana()
      .signTransaction(walletId, { transaction: signedBase64 })
    signedBase64 = result.signed_transaction
  } catch (e) {
    return {
      ok: false,
      reason: "sign_failed",
      detail: `instinct sign failed: ${e instanceof Error ? e.message : String(e)}`,
    }
  }

  const execRes = await fetch(`${JUPITER_URL}/execute`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      signedTransaction: signedBase64,
      requestId: quote.requestId,
      lastValidBlockHeight: quote.lastValidBlockHeight ?? undefined,
    }),
  })

  if (!execRes.ok) {
    return {
      ok: false,
      reason: "execute_failed",
      detail: `${execRes.status} ${await execRes.text()}`,
    }
  }

  const exec = (await execRes.json()) as JupiterExecuteResponse

  if (exec.status !== "Success" || !exec.signature) {
    return {
      ok: false,
      reason: "execute_failed",
      detail: `status=${exec.status} code=${exec.code} error=${exec.error ?? "unknown"}`,
    }
  }

  return {
    ok: true,
    signature: exec.signature,
    inAtomic: exec.inputAmountResult ?? "0",
    outAtomic: exec.outputAmountResult ?? quote.outAmount,
    maker: quote.maker,
    router: quote.router,
  }
}

/**
 * Server-signs a USDC transfer from the Instinct wallet to any destination.
 * Treasury pays fees if configured (multi-sign), else Instinct pays from its
 * own SOL. Used for refunds (partial/failed/cancelled deposits).
 */
export async function transferUsdc(params: {
  fromWalletId: string
  fromAddress: string
  toAddress: string
  amountAtomic: bigint
}): Promise<{ ok: true; signature: string } | { ok: false; detail: string }> {
  const treasuryWalletId = process.env.TREASURY_WALLET_ID
  const treasuryAddress = await getTreasuryAddress()
  const rpcUrl = process.env.RPC_URL
  if (!rpcUrl) {
    return { ok: false, detail: "RPC_URL not set" }
  }

  const connection = new Connection(rpcUrl, "confirmed")
  const fromPk = new PublicKey(params.fromAddress)
  const toPk = new PublicKey(params.toAddress)
  const fromAta = getAssociatedTokenAddressSync(USDC_MINT, fromPk)
  const toAta = getAssociatedTokenAddressSync(USDC_MINT, toPk)

  const feePayerPk =
    treasuryAddress && treasuryWalletId ? new PublicKey(treasuryAddress) : fromPk

  try {
    const { blockhash } = await connection.getLatestBlockhash()
    const message = new TransactionMessage({
      payerKey: feePayerPk,
      recentBlockhash: blockhash,
      instructions: [
        createTransferCheckedInstruction(
          fromAta,
          USDC_MINT,
          toAta,
          fromPk,
          params.amountAtomic,
          USDC_DECIMALS,
        ),
      ],
    }).compileToV0Message()
    const tx = new VersionedTransaction(message)
    let signedBase64 = Buffer.from(tx.serialize()).toString("base64")

    // Treasury (fee payer) signs first if used
    if (treasuryWalletId && feePayerPk.toBase58() === treasuryAddress) {
      const r = await privy
        .wallets()
        .solana()
        .signTransaction(treasuryWalletId, { transaction: signedBase64 })
      signedBase64 = r.signed_transaction
    }

    // Instinct (token owner) signs
    const r = await privy
      .wallets()
      .solana()
      .signTransaction(params.fromWalletId, { transaction: signedBase64 })
    signedBase64 = r.signed_transaction

    const sig = await connection.sendRawTransaction(
      Buffer.from(signedBase64, "base64"),
    )
    await connection.confirmTransaction(sig, "confirmed")
    return { ok: true, signature: sig }
  } catch (e) {
    return {
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    }
  }
}
