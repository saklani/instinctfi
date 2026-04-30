import { describe, it, expect } from "vitest"
import { buildUsdcTransfer } from "../transfer"

// Two random mainnet addresses for testing
const FROM = "4RLo2SCDEbFFWU9R1Pw5ogz7YHevxv1gLevZ3RyMEFFL"
const TO = "57eNMtbwjWhkF2gCmy3yCzxaCpAXpeQyDqZYz5ANnZJ7"

describe("buildUsdcTransfer", () => {
  it("returns a non-empty transaction", async () => {
    const result = await buildUsdcTransfer({
      from: FROM,
      to: TO,
      amount: 1_000_000n, // 1 USDC
    })

    expect(result.transaction).toBeInstanceOf(Uint8Array)
    expect(result.transaction.length).toBeGreaterThan(0)
  })

  it("returns a valid blockhash", async () => {
    const result = await buildUsdcTransfer({
      from: FROM,
      to: TO,
      amount: 50_000_000n, // 50 USDC
    })

    expect(result.blockhash).toBeDefined()
    expect(result.blockhash.blockhash).toBeTruthy()
    expect(result.blockhash.lastValidBlockHeight).toBeGreaterThan(0n)
  })

  it("works with different amounts", async () => {
    const small = await buildUsdcTransfer({
      from: FROM,
      to: TO,
      amount: 1n, // smallest unit
    })

    const large = await buildUsdcTransfer({
      from: FROM,
      to: TO,
      amount: 100_000_000_000n, // 100k USDC
    })

    expect(small.transaction.length).toBeGreaterThan(0)
    expect(large.transaction.length).toBeGreaterThan(0)
    // Different amounts should produce different transactions
    expect(small.transaction).not.toEqual(large.transaction)
  })
})
