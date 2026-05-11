import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { StickyCta } from "./sticky-cta"

const meta: Meta<typeof StickyCta> = {
  title: "Components/StickyCta",
  component: StickyCta,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
}
export default meta

type Story = StoryObj<typeof StickyCta>

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[100vh] w-full bg-canvas">
      <div className="mx-auto max-w-[420px] px-4 pt-6">
        <h1 className="text-display-md text-ink">Vault Detail</h1>
        <p className="mt-3 text-body text-ink-muted">
          Scroll to test scroll-down recede behavior. The sticky CTA insets
          above the bottom tab bar + safe-area.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-card bg-secondary"
            />
          ))}
        </div>
      </div>
      {/* Stub bottom tab bar to mirror the real layout */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-16 border-t border-hairline bg-canvas/90" />
      {children}
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <MobileFrame>
      <StickyCta onClick={() => console.log("clicked")} expandable>
        Deposit USDC
      </StickyCta>
    </MobileFrame>
  ),
}

export const NoChevron: Story = {
  render: () => (
    <MobileFrame>
      <StickyCta onClick={() => console.log("clicked")}>
        Continue
      </StickyCta>
    </MobileFrame>
  ),
}

export const Disabled: Story = {
  render: () => (
    <MobileFrame>
      <StickyCta disabled expandable>
        Loading…
      </StickyCta>
    </MobileFrame>
  ),
}
