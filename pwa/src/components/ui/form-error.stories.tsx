import type { Meta, StoryObj } from "@storybook/react-vite"
import { FormError } from "./form-error"

const meta: Meta<typeof FormError> = {
  title: "UI/FormError",
  component: FormError,
}
export default meta

type Story = StoryObj<typeof FormError>

export const Default: Story = {
  args: { message: "Amount is required" },
}

export const LongMessage: Story = {
  args: { message: "Amount must be greater than 0 and less than your available balance" },
}

export const NoMessage: Story = {
  args: { message: undefined },
}
