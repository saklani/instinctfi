import type { Meta, StoryObj } from "@storybook/react-vite"
import { Column } from "./column"
import { Skeleton } from "./skeleton"

const meta: Meta<typeof Column> = {
  title: "UI/Column",
  component: Column,
}
export default meta

type Story = StoryObj<typeof Column>

export const Default: Story = {
  render: () => (
    <Column className="max-w-sm">
      <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
      <p className="text-sm text-muted-foreground">Your cheatcode to Internet Capital Markets.</p>
    </Column>
  ),
}

export const WithGap6: Story = {
  render: () => (
    <Column className="gap-6 max-w-sm">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </Column>
  ),
}
