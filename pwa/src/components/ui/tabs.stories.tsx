import type { Meta, StoryObj } from "@storybook/react-vite"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
}
export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="deposit" className="max-w-sm">
      <TabsList className="w-full">
        <TabsTrigger value="deposit" className="flex-1">Deposit</TabsTrigger>
        <TabsTrigger value="withdraw" className="flex-1">Withdraw</TabsTrigger>
      </TabsList>
      <TabsContent value="deposit">
        <p className="text-sm text-muted-foreground pt-4">Deposit content here</p>
      </TabsContent>
      <TabsContent value="withdraw">
        <p className="text-sm text-muted-foreground pt-4">Withdraw content here</p>
      </TabsContent>
    </Tabs>
  ),
}

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="max-w-sm">
      <TabsList className="w-full">
        <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
        <TabsTrigger value="holdings" className="flex-1">Holdings</TabsTrigger>
        <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-muted-foreground pt-4">Overview content</p>
      </TabsContent>
    </Tabs>
  ),
}
