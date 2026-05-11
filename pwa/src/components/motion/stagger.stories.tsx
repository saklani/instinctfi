import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"

import { Stagger } from "./stagger"

const meta: Meta<typeof Stagger> = {
  title: "Motion/Stagger",
  component: Stagger,
}
export default meta

type Story = StoryObj<typeof Stagger>

const Row = ({ label }: { label: string }) => (
  <div className="rounded-card border border-hairline bg-surface px-5 py-3 text-body text-ink">
    {label}
  </div>
)

export const Default: Story = {
  render: () => {
    const [key, setKey] = React.useState(0)
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="self-start rounded-pill bg-cta px-4 py-2 text-body-sm text-cta-ink"
        >
          Replay
        </button>
        <Stagger key={key} className="flex flex-col gap-2">
          {[
            "1. AAPL",
            "2. NVDA",
            "3. MSFT",
            "4. GOOGL",
            "5. META",
            "6. AMZN",
          ].map((label) => (
            <Stagger.Item key={label}>
              <Row label={label} />
            </Stagger.Item>
          ))}
        </Stagger>
      </div>
    )
  },
}

export const FastGap: Story = {
  render: () => {
    const [key, setKey] = React.useState(0)
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="self-start rounded-pill bg-cta px-4 py-2 text-body-sm text-cta-ink"
        >
          Replay
        </button>
        <Stagger key={key} gap={0.02} className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Stagger.Item key={i}>
              <Row label={`Row ${i + 1}`} />
            </Stagger.Item>
          ))}
        </Stagger>
      </div>
    )
  },
}
