import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"

import { PathDraw } from "./path-draw"

const meta: Meta = {
  title: "Motion/PathDraw",
}
export default meta

type Story = StoryObj

export const CheckmarkOnAccent: Story = {
  render: () => {
    const [key, setKey] = React.useState(0)
    return (
      <div className="flex flex-col items-start gap-3">
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="rounded-pill bg-cta px-4 py-2 text-body-sm text-cta-ink"
        >
          Replay
        </button>
        <div
          key={key}
          className="flex size-20 items-center justify-center rounded-full bg-accent text-accent-ink"
        >
          <svg viewBox="0 0 24 24" className="size-10 stroke-current" fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <PathDraw d="M5 12.5l4 4 10-10" duration={0.5} />
          </svg>
        </div>
      </div>
    )
  },
}

export const Arrow: Story = {
  render: () => {
    const [key, setKey] = React.useState(0)
    return (
      <div className="flex flex-col items-start gap-3">
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="rounded-pill bg-cta px-4 py-2 text-body-sm text-cta-ink"
        >
          Replay
        </button>
        <svg
          key={key}
          viewBox="0 0 120 24"
          className="h-6 w-32 stroke-accent"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <PathDraw d="M2 12 H110 M100 4 L116 12 L100 20" duration={0.7} />
        </svg>
      </div>
    )
  },
}
