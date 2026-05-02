import type { Meta, StoryObj } from "@storybook/react-vite"

import { withRouter } from "../../../../.storybook/with-router"
import {
  HoldingRow,
  HoldingTableHeader,
  type HoldingRowData,
} from "./holding-row"
import type { Vault } from "@/features/vaults/api"

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

const sample: HoldingRowData[] = [
  {
    vaultId: "v1",
    vault: vault("v1", "Magnificent Seven"),
    ticker: "MAG7",
    units: 12.4,
    value: 1842.21,
    delta24h: 0.0184,
  },
  {
    vaultId: "v2",
    vault: vault("v2", "AI Infrastructure"),
    ticker: "AIINF",
    units: 4.2,
    value: 612.04,
    delta24h: 0.0421,
  },
  {
    vaultId: "v3",
    vault: vault("v3", "Solana Treasury Plays"),
    ticker: null,
    units: 9.7,
    value: 411.18,
    delta24h: -0.0072,
  },
  {
    vaultId: "v4",
    vault: vault("v4", "Defensive Income"),
    ticker: null,
    units: 1.05,
    value: 84.92,
    delta24h: 0.0021,
  },
]

const meta: Meta<typeof HoldingRow> = {
  title: "Features/HoldingRow",
  component: HoldingRow,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter("/portfolio")],
}
export default meta

type Story = StoryObj<typeof HoldingRow>

export const SingleRow: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col">
        <HoldingTableHeader />
        <div className="flex flex-col divide-y divide-hairline">
          <HoldingRow row={sample[0]} />
        </div>
      </div>
    </div>
  ),
}

export const Table: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col">
        <HoldingTableHeader />
        <div className="flex flex-col divide-y divide-hairline">
          {sample.map((row) => (
            <HoldingRow key={row.vaultId} row={row} />
          ))}
        </div>
      </div>
    </div>
  ),
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => (
    <div className="p-3">
      <div className="flex flex-col">
        <HoldingTableHeader />
        <div className="flex flex-col divide-y divide-hairline">
          {sample.map((row) => (
            <HoldingRow key={row.vaultId} row={row} />
          ))}
        </div>
      </div>
    </div>
  ),
}

export const MissingVault: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col">
        <HoldingTableHeader />
        <div className="flex flex-col divide-y divide-hairline">
          <HoldingRow
            row={{
              vaultId: "unknown",
              vault: null,
              ticker: null,
              units: 0,
              value: 0,
              delta24h: null,
            }}
          />
        </div>
      </div>
    </div>
  ),
}
