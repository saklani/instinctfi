import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input, SearchInput } from "./input"
import { Label } from "./label"

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "pill", "search"],
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
  },
}
export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: { placeholder: "0.00" },
}

export const Pill: Story = {
  args: { placeholder: "Enter amount", variant: "pill", size: "lg" },
}

export const Search: Story = {
  render: () => <SearchInput shortcut="⌘K" />,
}

export const SearchMobile: Story = {
  render: () => <SearchInput size="default" />,
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="amount">Amount (USDC)</Label>
      <Input id="amount" type="number" placeholder="0.00" variant="pill" size="lg" />
    </div>
  ),
}

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true, variant: "pill" },
}

export const Invalid: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="invalid">Amount</Label>
      <Input id="invalid" aria-invalid placeholder="0.00" variant="pill" />
      <p className="text-body-sm text-destructive">Amount is required.</p>
    </div>
  ),
}
