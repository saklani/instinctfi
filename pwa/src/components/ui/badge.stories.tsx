import type { Meta, StoryObj } from "@storybook/react-vite"
import { Badge } from "./badge"

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
  },
}
export default meta

type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: { children: "Badge" },
}

export const Secondary: Story = {
  args: { children: "Secondary", variant: "secondary" },
}

export const Destructive: Story = {
  args: { children: "Destructive", variant: "destructive" },
}

export const Outline: Story = {
  args: { children: "Outline", variant: "outline" },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  ),
}

export const CompositionBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">NVDAx 22%</Badge>
      <Badge variant="secondary">GOOGLx 17%</Badge>
      <Badge variant="secondary">AMZNx 13%</Badge>
      <Badge variant="secondary">AAPLx 10%</Badge>
    </div>
  ),
}
