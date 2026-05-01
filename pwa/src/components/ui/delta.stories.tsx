import type { Meta, StoryObj } from "@storybook/react-vite"
import { Delta } from "./delta"

const meta: Meta<typeof Delta> = {
  title: "UI/Delta",
  component: Delta,
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    asPercent: { control: "boolean" },
    hideArrow: { control: "boolean" },
    showSign: { control: "boolean" },
  },
}
export default meta

type Story = StoryObj<typeof Delta>

export const Positive: Story = {
  args: { value: 0.0234 },
}

export const Negative: Story = {
  args: { value: -0.0112 },
}

export const Neutral: Story = {
  args: { value: 0 },
}

export const Missing: Story = {
  args: { value: null },
}

export const AsPercentAlready: Story = {
  args: { value: 12.4, asPercent: true },
}

export const WithSuffix: Story = {
  args: { value: 0.041, suffix: "24h" },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Delta value={0.012} size="sm" />
      <Delta value={0.0345} size="md" />
      <Delta value={-0.092} size="lg" />
    </div>
  ),
}

export const TableRow: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-mono-sm">
      <span className="text-ink">$NVDA</span>
      <Delta value={0.0234} hideArrow />
      <Delta value={0.114} hideArrow />
      <span className="text-ink">$GOOGL</span>
      <Delta value={-0.0112} hideArrow />
      <Delta value={0.043} hideArrow />
      <span className="text-ink">$AMZN</span>
      <Delta value={0.0006} hideArrow />
      <Delta value={-0.021} hideArrow />
    </div>
  ),
}
