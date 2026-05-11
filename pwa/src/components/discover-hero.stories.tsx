import type { Meta, StoryObj } from "@storybook/react-vite"

import { DiscoverHero } from "./discover-hero"

const meta: Meta<typeof DiscoverHero> = {
  title: "Surfaces/DiscoverHero",
  component: DiscoverHero,
  parameters: { layout: "fullscreen" },
}
export default meta

type Story = StoryObj<typeof DiscoverHero>

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: "desktop" } },
  render: () => (
    <div className="mx-auto max-w-6xl py-10">
      <DiscoverHero />
    </div>
  ),
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => (
    <div className="px-2 py-6">
      <DiscoverHero />
    </div>
  ),
}
