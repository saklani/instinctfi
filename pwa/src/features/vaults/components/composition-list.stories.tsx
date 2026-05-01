import type { Meta, StoryObj } from "@storybook/react-vite"

import { CompositionList, type CompositionItem } from "./composition-list"

const meta: Meta<typeof CompositionList> = {
  title: "Features/CompositionList",
  component: CompositionList,
}
export default meta

type Story = StoryObj<typeof CompositionList>

const sample: CompositionItem[] = [
  {
    id: "aapl",
    ticker: "AAPL",
    name: "Apple Inc.",
    logoUrl: "https://logo.clearbit.com/apple.com",
    weightBps: 2400,
    delta24h: 0.0124,
  },
  {
    id: "nvda",
    ticker: "NVDA",
    name: "NVIDIA",
    logoUrl: "https://logo.clearbit.com/nvidia.com",
    weightBps: 1800,
    delta24h: 0.0342,
  },
  {
    id: "msft",
    ticker: "MSFT",
    name: "Microsoft",
    logoUrl: "https://logo.clearbit.com/microsoft.com",
    weightBps: 1500,
    delta24h: -0.0061,
  },
  {
    id: "googl",
    ticker: "GOOGL",
    name: "Alphabet",
    logoUrl: "https://logo.clearbit.com/abc.xyz",
    weightBps: 1200,
    delta24h: 0.0085,
  },
  {
    id: "tsla",
    ticker: "TSLA",
    name: "Tesla",
    logoUrl: "https://logo.clearbit.com/tesla.com",
    weightBps: 900,
    delta24h: -0.0212,
  },
  {
    id: "meta",
    ticker: "META",
    name: "Meta Platforms",
    logoUrl: "https://logo.clearbit.com/meta.com",
    weightBps: 700,
    delta24h: 0.0014,
  },
]

export const Default: Story = {
  render: () => (
    <div className="w-[480px] max-w-full">
      <CompositionList items={sample} />
    </div>
  ),
}

export const WithLinks: Story = {
  render: () => (
    <div className="w-[480px] max-w-full">
      <CompositionList
        items={sample.map((s) => ({ ...s, href: `#${s.ticker.toLowerCase()}` }))}
      />
    </div>
  ),
}

export const NoLogos: Story = {
  render: () => (
    <div className="w-[480px] max-w-full">
      <CompositionList
        items={sample.map((s) => ({ ...s, logoUrl: null }))}
      />
    </div>
  ),
}

export const NoDelta: Story = {
  render: () => (
    <div className="w-[480px] max-w-full">
      <CompositionList
        items={sample.map((s) => ({ ...s, delta24h: null }))}
      />
    </div>
  ),
}

export const StaticMotion: Story = {
  render: () => (
    <div className="w-[480px] max-w-full">
      <CompositionList items={sample} staticMotion />
    </div>
  ),
}

export const Empty: Story = {
  render: () => (
    <div className="w-[480px] max-w-full">
      <CompositionList items={[]} />
    </div>
  ),
}
