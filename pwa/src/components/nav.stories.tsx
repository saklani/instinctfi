import type { Meta, StoryObj } from "@storybook/react-vite"

import { Nav } from "./nav"
import { withRouter } from "../../.storybook/with-router"

const meta: Meta<typeof Nav> = {
  title: "Components/BottomTabBar",
  component: Nav,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [withRouter("/")],
}
export default meta

type Story = StoryObj<typeof Nav>

export const Default: Story = {
  render: () => (
    <div className="relative min-h-screen bg-canvas px-4 pt-6 pb-24">
      <p className="text-body text-ink-muted">
        Mobile-only bottom tab bar. Repainted to new tokens; structure preserved.
      </p>
      <Nav />
    </div>
  ),
}
