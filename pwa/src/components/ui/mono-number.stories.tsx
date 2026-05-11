import type { Meta, StoryObj } from "@storybook/react-vite"
import { MonoNumber } from "./mono-number"

const meta: Meta<typeof MonoNumber> = {
  title: "UI/MonoNumber",
  component: MonoNumber,
  argTypes: {
    format: {
      control: "select",
      options: ["usd", "pct", "count", "raw"],
    },
    size: { control: "select", options: ["sm", "md", "xl"] },
    compact: { control: "boolean" },
  },
}
export default meta

type Story = StoryObj<typeof MonoNumber>

export const Usd: Story = {
  args: { value: 12345.67, format: "usd", size: "xl" },
}

export const UsdCompact: Story = {
  args: { value: 1234567, format: "usd", compact: true, size: "md" },
}

export const Percent: Story = {
  args: { value: 12.4, format: "pct", size: "md" },
}

export const Count: Story = {
  args: { value: 12849, format: "count", size: "md" },
}

export const Missing: Story = {
  args: { value: null, format: "usd", size: "md" },
}

export const HeroPrice: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <span className="text-body-sm text-ink-muted">NAV</span>
      <MonoNumber value={134.52} format="usd" size="xl" />
    </div>
  ),
}

export const StatsGrid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6">
      <Stat label="TVL" value={1240000} format="usd" compact />
      <Stat label="24h Volume" value={92400} format="usd" compact />
      <Stat label="Holders" value={1284} format="count" />
      <Stat label="Performance Fee" value={2} format="pct" precision={0} />
      <Stat label="Mgmt Fee" value={0.5} format="pct" />
      <Stat label="Inception" value="2024-08-12" format="raw" />
    </div>
  ),
}

function Stat({
  label,
  value,
  format,
  precision,
  compact,
}: {
  label: string
  value: number | string | null
  format: "usd" | "pct" | "count" | "raw"
  precision?: number
  compact?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-body-sm uppercase tracking-[0.06em] text-ink-faint">
        {label}
      </span>
      {format === "raw" ? (
        <span className="text-mono-md">{String(value ?? "—")}</span>
      ) : (
        <MonoNumber
          value={value}
          format={format}
          precision={precision}
          compact={compact}
          size="md"
        />
      )}
    </div>
  )
}
