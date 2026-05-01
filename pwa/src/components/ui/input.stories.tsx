import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input } from "./input"
import { Label } from "./label"

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
}
export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: { placeholder: "Enter amount..." },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 max-w-sm">
      <Label htmlFor="amount">Amount (USDC)</Label>
      <Input id="amount" type="number" placeholder="0.00" />
    </div>
  ),
}

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true },
}

export const Invalid: Story = {
  render: () => (
    <div className="flex flex-col gap-2 max-w-sm">
      <Label htmlFor="invalid">Amount</Label>
      <Input id="invalid" aria-invalid placeholder="0.00" />
      <p className="text-sm text-destructive">Amount is required</p>
    </div>
  ),
}

export const Large: Story = {
  render: () => (
    <Input className="h-12 text-lg" placeholder="0.00" type="number" />
  ),
}
