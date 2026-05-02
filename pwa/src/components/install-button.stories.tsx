import type { Meta, StoryObj } from "@storybook/react-vite"

import { InstallButton } from "./install-button"

const meta: Meta<typeof InstallButton> = {
  title: "Components/InstallButton",
  component: InstallButton,
  parameters: {
    layout: "centered",
  },
}
export default meta

type Story = StoryObj<typeof InstallButton>

export const Installable: Story = {
  args: { forceInstallable: true },
}

export const IOSInstructions: Story = {
  args: { forceIOS: true },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
}

export const Hidden: Story = {
  name: "Hidden (already installed / unsupported)",
  render: () => (
    <div className="text-body-sm text-ink-muted">
      Renders nothing — component returns null when standalone or unsupported.
    </div>
  ),
}
