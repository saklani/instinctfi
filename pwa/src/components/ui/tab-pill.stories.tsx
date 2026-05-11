import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { TabPill, TabPillItem } from "./tab-pill"

const meta: Meta<typeof TabPill> = {
  title: "UI/TabPill",
  component: TabPill,
}
export default meta

type Story = StoryObj<typeof TabPill>

export const TimePeriod: Story = {
  render: () => {
    const [value, setValue] = useState("1D")
    return (
      <TabPill value={value} onValueChange={setValue} layoutId="time-pill">
        <TabPillItem value="1H">1H</TabPillItem>
        <TabPillItem value="1D">1D</TabPillItem>
        <TabPillItem value="1W">1W</TabPillItem>
        <TabPillItem value="1M">1M</TabPillItem>
        <TabPillItem value="1Y">1Y</TabPillItem>
        <TabPillItem value="ALL">ALL</TabPillItem>
      </TabPill>
    )
  },
}

export const DiscoverFilter: Story = {
  render: () => {
    const [value, setValue] = useState("All")
    return (
      <TabPill value={value} onValueChange={setValue} layoutId="discover-filter">
        <TabPillItem value="All">All</TabPillItem>
        <TabPillItem value="Stocks">Stocks</TabPillItem>
        <TabPillItem value="ETFs">ETFs</TabPillItem>
        <TabPillItem value="Themes">Themes</TabPillItem>
        <TabPillItem value="Sectors">Sectors</TabPillItem>
      </TabPill>
    )
  },
}

export const DepositTabs: Story = {
  render: () => {
    const [value, setValue] = useState("Deposit")
    return (
      <TabPill value={value} onValueChange={setValue} layoutId="deposit-tabs">
        <TabPillItem value="Deposit">Deposit</TabPillItem>
        <TabPillItem value="Withdraw">Withdraw</TabPillItem>
        <TabPillItem value="History">History</TabPillItem>
      </TabPill>
    )
  },
}
