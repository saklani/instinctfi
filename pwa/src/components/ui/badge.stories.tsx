import type { Meta, StoryObj } from "@storybook/react-vite"
import { Badge } from "./badge"

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "ghost",
        "link",
        "ticker",
        "count",
        "verified",
        "delta",
        "positive",
        "negative",
      ],
    },
    size: {
      control: "select",
      options: ["sm", "default", "md", "lg", "tag"],
    },
  },
}
export default meta

type Story = StoryObj<typeof Badge>

export const Ticker: Story = {
  args: { children: "$INSTNCT-MAG7", variant: "ticker", size: "md" },
}

export const Count: Story = {
  args: { children: "8+ HOLDINGS", variant: "count", size: "md" },
}

export const Verified: Story = {
  args: { children: "Curated", variant: "verified", size: "md" },
}

export const PositiveDelta: Story = {
  args: { children: "+2.34%", variant: "positive", size: "md" },
}

export const NegativeDelta: Story = {
  args: { children: "−1.12%", variant: "negative", size: "md" },
}

export const Default: Story = {
  args: { children: "Badge" },
}

export const Secondary: Story = {
  args: { children: "Secondary", variant: "secondary" },
}

export const Outline: Story = {
  args: { children: "Outline", variant: "outline" },
}

export const Destructive: Story = {
  args: { children: "Destructive", variant: "destructive" },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="ticker" size="md">$NVDA</Badge>
      <Badge variant="count" size="md">8+ HOLDINGS</Badge>
      <Badge variant="verified" size="md">Curated</Badge>
      <Badge variant="positive" size="md">+12.4%</Badge>
      <Badge variant="negative" size="md">−3.2%</Badge>
      <Badge variant="secondary">Stocks</Badge>
      <Badge variant="outline">Themes</Badge>
      <Badge variant="ghost">Sectors</Badge>
    </div>
  ),
}

export const CompositionBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="ticker" size="md">$NVDA 22%</Badge>
      <Badge variant="ticker" size="md">$GOOGL 17%</Badge>
      <Badge variant="ticker" size="md">$AMZN 13%</Badge>
      <Badge variant="ticker" size="md">$AAPL 10%</Badge>
    </div>
  ),
}
