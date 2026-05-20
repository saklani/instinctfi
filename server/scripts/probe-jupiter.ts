// Probe quoteSwap() against Jupiter for the Ondo tokenized-stock mints
// that have been failing. Uses the exact same code path as the worker so
// any treasury / api-key / payer divergence surfaces.
//
// Usage: cd server && bun run scripts/probe-jupiter.ts

import { quoteSwap } from "../src/lib/router.js"

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

// The 5 mints from the user's failing legs.
const ONDO_MINTS = [
  "FL7QzUq58pvkDxkftJm7RqRWgqYEFZwXuvAMsUnondo",
  "E9VQY3VnrpVSekFByzRmfeK1kxgM3UiKCoVVbdUondo",
  "kPBGL8vAwKN3UGmr9cjkM2dU79SC3nzTC9yu7F8ondo",
  "bdh3njeo19d2TBLAKTGvCWdSoArfVw8uZBAJHY4ondo",
  "F3dMJ9H137YUNc9cpN3gBWDSq4MSRbTFtojH65Uondo",
]

// Dummy taker — Jupiter requires *a* pubkey but doesn't verify ownership
// for the /order endpoint, only that the address parses.
const DUMMY_TAKER = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
const AMOUNT = 1_000_000n // $1 USDC atomic

console.log(`Probing ${ONDO_MINTS.length} Ondo mints @ $1 USDC each…\n`)

for (const mint of ONDO_MINTS) {
  const result = await quoteSwap({
    inputMint: USDC,
    outputMint: mint,
    amount: AMOUNT,
    walletAddress: DUMMY_TAKER,
  })

  const tag = mint.slice(0, 10) + "…" + mint.slice(-6)
  if (result.ok) {
    console.log(`✓ ${tag}  out=${result.outAmount}  router=${result.router}  maker=${result.maker ?? "—"}`)
  } else {
    console.log(`✗ ${tag}  ${result.reason}  ${result.detail.slice(0, 160)}`)
  }
}
