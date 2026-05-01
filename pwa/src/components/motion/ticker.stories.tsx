import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"

import { Ticker } from "./ticker"

const meta: Meta<typeof Ticker> = {
  title: "Motion/Ticker",
  component: Ticker,
}
export default meta

type Story = StoryObj<typeof Ticker>

export const Currency: Story = {
  render: () => {
    const [value, setValue] = React.useState(1284.36)
    return (
      <div className="flex flex-col items-start gap-3">
        <Ticker
          value={value}
          prefix="$"
          decimals={2}
          className="text-mono-xl text-ink"
        />
        <button
          type="button"
          onClick={() => setValue((v) => v + (Math.random() - 0.5) * 250)}
          className="rounded-pill bg-cta px-4 py-2 text-body-sm text-cta-ink"
        >
          Tick
        </button>
      </div>
    )
  },
}

export const Percent: Story = {
  render: () => {
    const [value, setValue] = React.useState(4.83)
    return (
      <div className="flex flex-col items-start gap-3">
        <Ticker
          value={value}
          decimals={2}
          suffix="%"
          className="text-mono-md text-positive"
        />
        <button
          type="button"
          onClick={() => setValue(Number((Math.random() * 20 - 5).toFixed(2)))}
          className="rounded-pill bg-cta px-4 py-2 text-body-sm text-cta-ink"
        >
          Tick
        </button>
      </div>
    )
  },
}

export const Count: Story = {
  render: () => {
    const [value, setValue] = React.useState(2480)
    return (
      <div className="flex flex-col items-start gap-3">
        <Ticker
          value={value}
          decimals={0}
          className="text-mono-md text-ink"
        />
        <button
          type="button"
          onClick={() => setValue((v) => v + Math.floor(Math.random() * 200))}
          className="rounded-pill bg-cta px-4 py-2 text-body-sm text-cta-ink"
        >
          Tick
        </button>
      </div>
    )
  },
}
