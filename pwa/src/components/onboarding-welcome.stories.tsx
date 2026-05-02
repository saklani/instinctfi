import type { Meta, StoryObj } from "@storybook/react-vite"
import { MotionConfig } from "framer-motion"

import { withRouter } from "../../.storybook/with-router"
import { OnboardingWelcome } from "./onboarding-welcome"

const meta: Meta<typeof OnboardingWelcome> = {
  title: "Components/OnboardingWelcome",
  component: OnboardingWelcome,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter("/")],
}
export default meta

type Story = StoryObj<typeof OnboardingWelcome>

export const Default: Story = {
  render: () => (
    <div className="bg-canvas">
      <OnboardingWelcome />
    </div>
  ),
}

export const ReducedMotion: Story = {
  render: () => (
    <div className="bg-canvas">
      <MotionConfig reducedMotion="always">
        <OnboardingWelcome />
      </MotionConfig>
    </div>
  ),
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => (
    <div className="bg-canvas">
      <OnboardingWelcome />
    </div>
  ),
}

export const CustomCopy: Story = {
  render: () => (
    <div className="bg-canvas">
      <OnboardingWelcome
        title="Welcome back."
        subtitle="Pick a basket to put new capital to work."
        ctaLabel="Browse vaults"
      />
    </div>
  ),
}
