import type { Meta, StoryObj } from "@storybook/react-vite"
import { Ticker, Count, Verified } from "./pill"

const meta: Meta = {
  title: "UI/Pill",
}
export default meta

type Story = StoryObj

export const TickerPill: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Ticker symbol="NVDA" />
      <Ticker symbol="$AAPL" />
      <Ticker symbol="INSTNCT-MAG7" />
    </div>
  ),
}

export const CountPill: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Count>8+ HOLDINGS</Count>
      <Count interactive>14 VAULTS</Count>
    </div>
  ),
}

export const VerifiedPill: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Verified />
      <Verified label="instinct curated" />
      <Verified showLabel={false} aria-label="Curated" />
    </div>
  ),
}

export const AllPills: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Ticker symbol="MAG7" />
      <Count interactive>8+ HOLDINGS</Count>
      <Verified />
    </div>
  ),
}
