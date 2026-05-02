import type { Meta, StoryObj } from "@storybook/react-vite"

import { TopNav } from "./top-nav"
import { InstallButton } from "./install-button"
import { withRouter } from "../../.storybook/with-router"

const meta: Meta<typeof TopNav> = {
  title: "Components/TopNav",
  component: TopNav,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [withRouter("/")],
}
export default meta

type Story = StoryObj<typeof TopNav>

const Filler = () => (
  <div className="px-6 py-12 text-body text-ink-muted">
    Scroll behind the nav demonstrates the sticky bg + hairline animate-in past
    32px scroll.
  </div>
)

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-canvas">
      <TopNav rightSlot={<InstallButton forceInstallable />} />
      <Filler />
    </div>
  ),
}

export const Scrolled: Story = {
  render: () => (
    <div className="min-h-screen bg-canvas">
      <TopNav forceScrolled rightSlot={<InstallButton forceInstallable />} />
      <Filler />
    </div>
  ),
}

export const IOSInstructions: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => (
    <div className="min-h-screen bg-canvas">
      <TopNav rightSlot={<InstallButton forceIOS />} />
      <Filler />
    </div>
  ),
}

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => (
    <div className="min-h-screen bg-canvas">
      <TopNav rightSlot={<InstallButton forceInstallable />} />
      <Filler />
    </div>
  ),
}

export const Empty: Story = {
  name: "Empty (already installed / unsupported)",
  render: () => (
    <div className="min-h-screen bg-canvas">
      <TopNav rightSlot={null} />
      <Filler />
    </div>
  ),
}
