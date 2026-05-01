import type { Meta, StoryObj } from "@storybook/react-vite"

import { TopNav } from "./top-nav"
import {
  ConnectedWalletPill,
  DisconnectedWalletPill,
} from "./wallet-button"
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

const sampleAddress = "7HkH1pErJgkR8GvRf3CoLWzNo9ABbYeyhX2u4qZ4n1pE"

const Filler = () => (
  <div className="px-6 py-12 text-body text-ink-muted">
    Scroll behind the nav demonstrates the sticky bg + hairline animate-in past
    32px scroll.
  </div>
)

export const Disconnected: Story = {
  render: () => (
    <div className="min-h-screen bg-canvas">
      <TopNav
        walletSlot={<DisconnectedWalletPill onConnect={() => {}} />}
      />
      <Filler />
    </div>
  ),
}

export const Connected: Story = {
  render: () => (
    <div className="min-h-screen bg-canvas">
      <TopNav
        walletSlot={
          <ConnectedWalletPill
            address={sampleAddress}
            onDisconnect={() => {}}
          />
        }
      />
      <Filler />
    </div>
  ),
}

export const Scrolled: Story = {
  render: () => (
    <div className="min-h-screen bg-canvas">
      <TopNav
        forceScrolled
        walletSlot={
          <ConnectedWalletPill
            address={sampleAddress}
            onDisconnect={() => {}}
          />
        }
      />
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
      <TopNav
        walletSlot={
          <ConnectedWalletPill
            address={sampleAddress}
            compact
            onDisconnect={() => {}}
          />
        }
      />
      <Filler />
    </div>
  ),
}

export const MobileDisconnected: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => (
    <div className="min-h-screen bg-canvas">
      <TopNav
        walletSlot={<DisconnectedWalletPill compact onConnect={() => {}} />}
      />
      <Filler />
    </div>
  ),
}
