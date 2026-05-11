import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  ConnectedWalletPill,
  DisconnectedWalletPill,
} from "./wallet-button"
import { withRouter } from "../../.storybook/with-router"

const meta: Meta = {
  title: "Components/WalletButton",
  decorators: [withRouter("/")],
}
export default meta

type Story = StoryObj

const sampleAddress = "7HkH1pErJgkR8GvRf3CoLWzNo9ABbYeyhX2u4qZ4n1pE"

export const Disconnected: Story = {
  render: () => <DisconnectedWalletPill onConnect={() => {}} />,
}

export const DisconnectedCompact: Story = {
  render: () => <DisconnectedWalletPill compact onConnect={() => {}} />,
}

export const Connected: Story = {
  render: () => (
    <ConnectedWalletPill
      address={sampleAddress}
      onDisconnect={() => {}}
    />
  ),
}

export const ConnectedCompact: Story = {
  render: () => (
    <ConnectedWalletPill
      address={sampleAddress}
      compact
      onDisconnect={() => {}}
    />
  ),
}
