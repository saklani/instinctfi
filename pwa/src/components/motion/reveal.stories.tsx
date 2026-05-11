import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"

import { Reveal } from "./reveal"

const meta: Meta<typeof Reveal> = {
  title: "Motion/Reveal",
  component: Reveal,
}
export default meta

type Story = StoryObj<typeof Reveal>

const Card = ({ label }: { label: string }) => (
  <div className="rounded-card border border-hairline bg-surface p-6 text-body text-ink shadow-card">
    {label}
  </div>
)

export const Default: Story = {
  render: () => {
    const [key, setKey] = React.useState(0)
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="self-start rounded-pill bg-cta px-4 py-2 text-body-sm text-cta-ink"
        >
          Replay
        </button>
        <Reveal key={key}>
          <Card label="Fades + slides up 8px in 280ms (out-quart)" />
        </Reveal>
      </div>
    )
  },
}

export const CustomOffset: Story = {
  render: () => {
    const [key, setKey] = React.useState(0)
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="self-start rounded-pill bg-cta px-4 py-2 text-body-sm text-cta-ink"
        >
          Replay
        </button>
        <Reveal key={key} offset={32} duration={0.6}>
          <Card label="32px slide, 600ms" />
        </Reveal>
      </div>
    )
  },
}

export const WithDelay: Story = {
  render: () => {
    const [key, setKey] = React.useState(0)
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="self-start rounded-pill bg-cta px-4 py-2 text-body-sm text-cta-ink"
        >
          Replay
        </button>
        <div className="flex flex-col gap-2">
          <Reveal key={`a-${key}`} delay={0}>
            <Card label="Delay 0ms" />
          </Reveal>
          <Reveal key={`b-${key}`} delay={0.12}>
            <Card label="Delay 120ms" />
          </Reveal>
          <Reveal key={`c-${key}`} delay={0.24}>
            <Card label="Delay 240ms" />
          </Reveal>
        </div>
      </div>
    )
  },
}
