import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"

import { TabPill, TabPillItem } from "@/components/ui/tab-pill"

const meta: Meta = {
  title: "Motion/LayoutPill",
}
export default meta

type Story = StoryObj

export const TabSwitch: Story = {
  render: () => {
    const [tab, setTab] = React.useState("deposit")
    return (
      <TabPill value={tab} onValueChange={setTab} layoutId="story-tabs">
        <TabPillItem value="deposit">Deposit</TabPillItem>
        <TabPillItem value="withdraw">Withdraw</TabPillItem>
        <TabPillItem value="history">History</TabPillItem>
      </TabPill>
    )
  },
}

export const TimePeriods: Story = {
  render: () => {
    const [period, setPeriod] = React.useState("1m")
    return (
      <TabPill value={period} onValueChange={setPeriod} layoutId="story-time">
        <TabPillItem value="1d">1D</TabPillItem>
        <TabPillItem value="1w">1W</TabPillItem>
        <TabPillItem value="1m">1M</TabPillItem>
        <TabPillItem value="1y">1Y</TabPillItem>
        <TabPillItem value="all">ALL</TabPillItem>
      </TabPill>
    )
  },
}
