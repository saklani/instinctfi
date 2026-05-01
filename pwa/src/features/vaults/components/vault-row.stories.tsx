import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  VaultRow,
  VaultTableHeader,
  type VaultRowData,
  type VaultSortKey,
  type VaultSortState,
} from "./vault-row"
import type { Vault } from "../api"

function vault(id: string, name: string, imageUrl: string | null = null): Vault {
  return {
    id,
    name,
    description: null,
    imageUrl,
    vaultAddress: "",
    vaultMint: "",
    depositFeeBps: 25,
    withdrawFeeBps: 25,
    compositions: [
      {
        weightBps: 2400,
        stock: {
          id: `${id}-aapl`,
          name: "Apple",
          ticker: "AAPL",
          imageUrl: "https://logo.clearbit.com/apple.com",
          description: null,
          address: "",
          decimals: 6,
        },
      },
      {
        weightBps: 1900,
        stock: {
          id: `${id}-nvda`,
          name: "NVIDIA",
          ticker: "NVDA",
          imageUrl: "https://logo.clearbit.com/nvidia.com",
          description: null,
          address: "",
          decimals: 6,
        },
      },
    ],
  }
}

const sample: VaultRowData[] = [
  {
    vault: vault("v1", "Magnificent Seven"),
    ticker: "MAG7",
    nav: 128.42,
    delta24h: 0.0184,
    delta7d: 0.0412,
    tvl: 4_280_000,
    holders: 312,
    inception: "2024-08-12",
  },
  {
    vault: vault("v2", "AI Infrastructure"),
    ticker: "AIINF",
    nav: 42.18,
    delta24h: 0.0421,
    delta7d: 0.0689,
    tvl: 1_120_000,
    holders: 184,
    inception: "2024-11-04",
  },
  {
    vault: vault("v3", "Solana Treasury Plays"),
    ticker: "SOLTRY",
    nav: 97.61,
    delta24h: -0.0072,
    delta7d: 0.0153,
    tvl: 824_000,
    holders: 92,
    inception: "2025-02-21",
  },
  {
    vault: vault("v4", "Defensive Income"),
    ticker: "DEFINC",
    nav: 18.04,
    delta24h: 0.0021,
    delta7d: -0.0084,
    tvl: 612_000,
    holders: 71,
    inception: "2024-06-09",
  },
]

const meta: Meta<typeof VaultRow> = {
  title: "Features/VaultRow",
  component: VaultRow,
  parameters: { layout: "fullscreen" },
}
export default meta

type Story = StoryObj<typeof VaultRow>

export const SingleRow: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col">
        <VaultTableHeader />
        <div className="flex flex-col divide-y divide-hairline">
          <VaultRow row={sample[0]} />
        </div>
      </div>
    </div>
  ),
}

export const Table: Story = {
  render: () => {
    const [sort, setSort] = useState<VaultSortState>({ key: "tvl", dir: "desc" })
    const onSort = (key: VaultSortKey) =>
      setSort((p) =>
        p.key === key
          ? { key, dir: p.dir === "asc" ? "desc" : "asc" }
          : { key, dir: "desc" },
      )
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex flex-col">
          <VaultTableHeader sort={sort} onSortChange={onSort} />
          <div className="flex flex-col divide-y divide-hairline">
            {sample.map((row) => (
              <VaultRow key={row.vault.id} row={row} />
            ))}
          </div>
        </div>
      </div>
    )
  },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => (
    <div className="p-3">
      <div className="flex flex-col">
        <VaultTableHeader />
        <div className="flex flex-col divide-y divide-hairline">
          {sample.map((row) => (
            <VaultRow key={row.vault.id} row={row} />
          ))}
        </div>
      </div>
    </div>
  ),
}
