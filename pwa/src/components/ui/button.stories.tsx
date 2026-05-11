import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "./button"
import { ArrowRight, Mail, Share2 } from "lucide-react"

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "primary-accent",
        "secondary",
        "ghost",
        "outline",
        "icon",
        "default",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "default", "lg", "icon", "icon-sm", "icon-lg"],
    },
  },
}
export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { children: "Deposit USDC", variant: "primary" },
}

export const PrimaryAccent: Story = {
  args: { children: "Browse vaults", variant: "primary-accent" },
}

export const Secondary: Story = {
  args: { children: "Cancel", variant: "secondary" },
}

export const Ghost: Story = {
  args: { children: "Skip", variant: "ghost" },
}

export const Outline: Story = {
  args: { children: "All filters", variant: "outline" },
}

export const Icon: Story = {
  args: { variant: "icon", size: "icon", "aria-label": "Share" },
  render: (args) => (
    <Button {...args}>
      <Share2 />
    </Button>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <Button variant="primary-accent">
      Browse vaults <ArrowRight />
    </Button>
  ),
}

export const SizesPrimary: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="xs" variant="primary">XS</Button>
      <Button size="sm" variant="primary">Small</Button>
      <Button size="default" variant="primary">Default</Button>
      <Button size="lg" variant="primary">Large</Button>
    </div>
  ),
}

export const IconSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button variant="icon" size="icon-xs" aria-label="Mail"><Mail /></Button>
      <Button variant="icon" size="icon-sm" aria-label="Mail"><Mail /></Button>
      <Button variant="icon" size="icon" aria-label="Mail"><Mail /></Button>
      <Button variant="icon" size="icon-lg" aria-label="Mail"><Mail /></Button>
    </div>
  ),
}

export const Disabled: Story = {
  args: { children: "Disabled", variant: "primary", disabled: true },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="primary-accent">Primary Accent</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="icon" size="icon" aria-label="Share">
        <Share2 />
      </Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}
