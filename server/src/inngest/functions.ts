import { Connection, PublicKey } from "@solana/web3.js"
import { isNotNull, eq } from "drizzle-orm"

import { db } from "../db/index.js"
import { vaults, walletBalances } from "../db/schema.js"
import { fetchVault } from "../lib/symmetry.js"
import { inngest } from "./client.js"

const connection = new Connection(process.env.RPC_URL!, "confirmed")

/**
 * Periodic snapshot of the top-20 holders per deployed vault, written to
 * `wallet_balances`. Powers the /api/leaderboard endpoint.
 *
 * - `vault.nav` from Postgres is a growth INDEX, not USD/token. We pull the
 *   USD price per token from the Symmetry SDK (`fetchVault` already chains
 *   `loadVaultPrice`).
 * - Vault token decimals are 6 (verified on-chain). `getTokenLargestAccounts`
 *   returns `uiAmount` already normalized.
 */
export const snapshotLeaderboard = inngest.createFunction(
  {
    id: "snapshot-leaderboard",
    triggers: [{ cron: "*/5 * * * *" }],
  },
  async ({ step }) => {
    const deployed = await step.run("load-vaults", () =>
      db
        .select({ id: vaults.id, mint: vaults.mint, address: vaults.address })
        .from(vaults)
        .where(isNotNull(vaults.mint)),
    )

    for (const vault of deployed) {
      await step.run(`snapshot-${vault.id}`, async () => {
        if (!vault.mint || !vault.address) return

        const sdkVault = await fetchVault(vault.address)
        const pricePerToken = Number((sdkVault as { price?: number | string }).price ?? 0)
        if (!pricePerToken) return

        const { value: largest } = await connection.getTokenLargestAccounts(
          new PublicKey(vault.mint),
        )
        if (!largest.length) return

        const tokenAccountKeys = largest.map((l) => l.address)
        const { value: parsed } =
          await connection.getMultipleParsedAccounts(tokenAccountKeys)

        const rows: typeof walletBalances.$inferInsert[] = []
        for (let i = 0; i < largest.length; i++) {
          const info = parsed[i]
          if (!info) continue
          const data = info.data as {
            parsed?: {
              info?: {
                owner: string
                tokenAmount: { uiAmount: number | null; amount: string }
              }
            }
          }
          const owner = data.parsed?.info?.owner
          const ui = data.parsed?.info?.tokenAmount?.uiAmount ?? 0
          const raw = data.parsed?.info?.tokenAmount?.amount ?? "0"
          if (!owner || ui === 0) continue
          rows.push({
            address: owner,
            vaultId: vault.id,
            balance: raw,
            balanceUi: String(ui),
            valueUsd: String(ui * pricePerToken),
          })
        }

        if (!rows.length) return

        await db.transaction(async (tx) => {
          await tx
            .delete(walletBalances)
            .where(eq(walletBalances.vaultId, vault.id))
          await tx.insert(walletBalances).values(rows)
        })
      })
    }
  },
)
