import type { Meta, StoryObj } from "@storybook/react-vite"
import { LoadingButton } from "./loading-button"

const meta: Meta<typeof LoadingButton> = {
  title: "UI/LoadingButton",
  component: LoadingButton,
  argTypes: {
    isLoading: { control: "boolean" },
  },
}
export default meta

type Story = StoryObj<typeof LoadingButton>

export const Idle: Story = {
  args: { children: "Deposit", size: "lg", className: "w-48" },
}

export const Loading: Story = {
  args: { children: "Deposit", size: "lg", className: "w-48", isLoading: true },
}

export const DestructiveLoading: Story = {
  args: { children: "Withdraw", size: "lg", variant: "destructive", className: "w-48", isLoading: true },
}
