import type { Meta, StoryObj } from "@storybook/react-vite"

import { withRouter } from "../../.storybook/with-router"
import { PortfolioEmpty } from "./portfolio-empty"

const meta: Meta<typeof PortfolioEmpty> = {
  title: "Components/PortfolioEmpty",
  component: PortfolioEmpty,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter("/portfolio")],
}
export default meta

type Story = StoryObj<typeof PortfolioEmpty>

export const Default: Story = {
  render: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PortfolioEmpty />
    </div>
  ),
}

export const Custom: Story = {
  render: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PortfolioEmpty
        title="Welcome back."
        subtitle="No positions yet for this wallet — pick a basket to begin."
        ctaLabel="Browse vaults"
      />
    </div>
  ),
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => (
    <div className="px-4 py-8">
      <PortfolioEmpty />
    </div>
  ),
}
