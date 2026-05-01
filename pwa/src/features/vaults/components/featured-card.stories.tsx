import type { Meta, StoryObj } from "@storybook/react-vite"

import { FeaturedCard } from "./featured-card"
import type { Vault } from "../api"

const sampleVault: Vault = {
  id: "v-mag7",
  name: "Magnificent Seven",
  description: "Mega-cap US tech, cap-weighted, monthly rebalanced.",
  imageUrl: null,
  vaultAddress: "8sM…rNpZ",
  vaultMint: "Vmt…7QpA",
  depositFeeBps: 25,
  withdrawFeeBps: 25,
  compositions: [
    {
      weightBps: 2400,
      stock: {
        id: "aapl",
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
        id: "nvda",
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

function buildSpark(seed: number, count = 28) {
  const out: number[] = []
  let v = 100 + (seed % 30)
  for (let i = 0; i < count; i++) {
    v +=
      Math.sin((i + (seed % 11)) * 0.45) * 1.4 +
      (((seed * (i + 3)) % 17) - 8) * 0.18
    out.push(Number(v.toFixed(2)))
  }
  return out
}

const meta: Meta<typeof FeaturedCard> = {
  title: "Features/FeaturedCard",
  component: FeaturedCard,
  parameters: { layout: "centered" },
}
export default meta

type Story = StoryObj<typeof FeaturedCard>

export const Trending: Story = {
  render: () => (
    <div className="w-[360px]">
      <FeaturedCard
        vault={sampleVault}
        kind="trending"
        ticker="MAG7"
        nav={128.42}
        delta={0.0184}
        spark={buildSpark(11)}
      />
    </div>
  ),
}

export const TopPerformer: Story = {
  render: () => (
    <div className="w-[360px]">
      <FeaturedCard
        vault={{ ...sampleVault, name: "AI Infrastructure" }}
        kind="top-24h"
        ticker="AIINF"
        nav={42.18}
        delta={0.0421}
        spark={buildSpark(31)}
      />
    </div>
  ),
}

export const Newest: Story = {
  render: () => (
    <div className="w-[360px]">
      <FeaturedCard
        vault={{ ...sampleVault, name: "Solana Treasury Plays" }}
        kind="newest"
        ticker="SOLTRY"
        nav={97.61}
        delta={-0.0072}
        spark={buildSpark(73)}
      />
    </div>
  ),
}

export const ThreeUp: Story = {
  render: () => (
    <div className="grid w-[1080px] max-w-full grid-cols-3 gap-6 p-6">
      <FeaturedCard
        vault={sampleVault}
        kind="trending"
        ticker="MAG7"
        nav={128.42}
        delta={0.0184}
        spark={buildSpark(11)}
      />
      <FeaturedCard
        vault={{ ...sampleVault, id: "v-ai", name: "AI Infrastructure" }}
        kind="top-24h"
        ticker="AIINF"
        nav={42.18}
        delta={0.0421}
        spark={buildSpark(31)}
      />
      <FeaturedCard
        vault={{ ...sampleVault, id: "v-sol", name: "Solana Treasury" }}
        kind="newest"
        ticker="SOLTRY"
        nav={97.61}
        delta={-0.0072}
        spark={buildSpark(73)}
      />
    </div>
  ),
}
