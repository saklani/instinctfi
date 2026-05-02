import type { Meta, StoryObj } from "@storybook/react-vite"

import { withRouter } from "../../../../.storybook/with-router"
import {
  ActivityRow,
  ActivityTableHeader,
  type ActivityRowData,
} from "./activity-row"
import type { Order } from "../api"

function order(partial: Partial<Order> & { id: string }): Order {
  return {
    vaultId: "v1",
    type: "deposit",
    amount: "100000000",
    status: "completed",
    signature: "5xK7mB3pQwLNcvDefGhIJkLmnOpQrStUvWxYz1234567890",
    createdAt: "2026-04-30T14:30:00.000Z",
    ...partial,
  }
}

const sample: ActivityRowData[] = [
  {
    order: order({
      id: "o1",
      type: "deposit",
      amount: "250000000",
      status: "completed",
      createdAt: "2026-05-01T10:14:00.000Z",
    }),
    vaultName: "Magnificent Seven",
  },
  {
    order: order({
      id: "o2",
      type: "deposit",
      amount: "75000000",
      status: "processing",
      signature: null,
      createdAt: "2026-04-28T18:02:00.000Z",
    }),
    vaultName: "AI Infrastructure",
  },
  {
    order: order({
      id: "o3",
      type: "withdraw",
      amount: "120000000",
      status: "completed",
      createdAt: "2026-04-22T09:47:00.000Z",
    }),
    vaultName: "Solana Treasury Plays",
  },
  {
    order: order({
      id: "o4",
      type: "deposit",
      amount: "40000000",
      status: "failed",
      signature: null,
      createdAt: "2026-04-19T22:11:00.000Z",
    }),
    vaultName: "Defensive Income",
  },
]

const meta: Meta<typeof ActivityRow> = {
  title: "Features/ActivityRow",
  component: ActivityRow,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter("/portfolio")],
}
export default meta

type Story = StoryObj<typeof ActivityRow>

export const SingleRow: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col">
        <ActivityTableHeader />
        <div className="flex flex-col divide-y divide-hairline">
          <ActivityRow row={sample[0]} />
        </div>
      </div>
    </div>
  ),
}

export const Table: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col">
        <ActivityTableHeader />
        <div className="flex flex-col divide-y divide-hairline">
          {sample.map((row) => (
            <ActivityRow key={row.order.id} row={row} />
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
        <ActivityTableHeader />
        <div className="flex flex-col divide-y divide-hairline">
          {sample.map((row) => (
            <ActivityRow key={row.order.id} row={row} />
          ))}
        </div>
      </div>
    </div>
  ),
}

export const MissingVaultName: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col">
        <ActivityTableHeader />
        <div className="flex flex-col divide-y divide-hairline">
          <ActivityRow
            row={{
              order: order({ id: "o-missing" }),
              vaultName: null,
            }}
          />
        </div>
      </div>
    </div>
  ),
}
