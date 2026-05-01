import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Camera, Share2 } from "lucide-react"

import { NavChart, type ChartPoint } from "./nav-chart"
import { TabPill, TabPillItem } from "@/components/ui/tab-pill"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const meta: Meta<typeof NavChart> = {
  title: "Chart/NavChart",
  component: NavChart,
}
export default meta

type Story = StoryObj<typeof NavChart>

function generateMock(periodDays: number, seed = 1): ChartPoint[] {
  const points: ChartPoint[] = []
  const today = new Date()
  const stepDays = periodDays > 365 ? 7 : periodDays > 90 ? 2 : 1
  const baseline = 100
  let drift = 0
  for (let i = periodDays; i >= 0; i -= stepDays) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const phase = ((periodDays - i) / Math.max(stepDays, 1)) * 0.18
    drift +=
      Math.sin(phase + seed) * 0.6 + Math.cos(phase * 1.7 + seed) * 0.35
    const value = baseline + drift * 1.4 + (periodDays - i) * 0.02
    points.push({
      date: d.toISOString().slice(0, 10),
      value: Number(Math.max(20, value).toFixed(2)),
    })
  }
  return points
}

const PERIODS = [
  { id: "1W", days: 7 },
  { id: "1M", days: 30 },
  { id: "3M", days: 90 },
  { id: "1Y", days: 365 },
  { id: "ALL", days: 730 },
] as const

export const Default: Story = {
  render: () => (
    <div className="w-[760px] max-w-full">
      <NavChart data={generateMock(90, 3)} />
    </div>
  ),
}

export const WithToolbar: Story = {
  render: () => {
    const [period, setPeriod] = React.useState<string>("3M")
    const days =
      PERIODS.find((p) => p.id === period)?.days ?? 90
    const data = React.useMemo(() => generateMock(days, 7), [days])
    return (
      <div className="w-[760px] max-w-full">
        <NavChart
          data={data}
          periodKey={period}
          periodSelector={
            <TabPill
              value={period}
              onValueChange={setPeriod}
              layoutId="story-time-pill"
              className="bg-canvas"
            >
              {PERIODS.map((p) => (
                <TabPillItem key={p.id} value={p.id}>
                  {p.id}
                </TabPillItem>
              ))}
            </TabPill>
          }
          toolbar={
            <div className="flex items-center gap-1">
              <Button variant="icon" size="icon-sm" aria-label="Snapshot">
                <Camera />
              </Button>
              <Button variant="icon" size="icon-sm" aria-label="Share">
                <Share2 />
              </Button>
            </div>
          }
        />
      </div>
    )
  },
}

export const InCard: Story = {
  render: () => (
    <Card className="w-[760px] max-w-full">
      <NavChart data={generateMock(180, 2)} />
    </Card>
  ),
}

export const ShortRange: Story = {
  render: () => (
    <div className="w-[760px] max-w-full">
      <NavChart data={generateMock(7, 5)} height={260} />
    </div>
  ),
}

export const Empty: Story = {
  render: () => (
    <div className="w-[760px] max-w-full">
      <NavChart data={[]} />
    </div>
  ),
}
