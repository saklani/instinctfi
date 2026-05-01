import type { Meta, StoryObj } from "@storybook/react-vite"
import { Skeleton } from "./skeleton"

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
}
export default meta

type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  args: { className: "h-4 w-48" },
}

export const Circle: Story = {
  args: { className: "size-10 rounded-full" },
}

export const BadgeShape: Story = {
  args: { className: "h-5 w-16 rounded-4xl" },
}

export const CardSkeleton: Story = {
  render: () => (
    <div className="flex flex-col gap-6 max-w-sm rounded-2xl p-6 ring-1 ring-foreground/10 shadow-sm">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-3 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-4xl" />
          <Skeleton className="h-5 w-16 rounded-4xl" />
          <Skeleton className="h-5 w-16 rounded-4xl" />
          <Skeleton className="h-5 w-16 rounded-4xl" />
        </div>
      </div>
    </div>
  ),
}
