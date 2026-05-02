import type { Meta, StoryObj } from "@storybook/react-vite"
import { Skeleton } from "./skeleton"
import { FeaturedCardSkeleton } from "@/features/vaults/components/featured-card"
import { VaultTableSkeleton } from "@/features/vaults/components/vault-row"
import { CompositionListSkeleton } from "@/features/vaults/components/composition-list"
import { NavChartSkeleton } from "@/components/chart/nav-chart"
import { DepositPanelSkeleton } from "@/features/vaults/components/deposit-panel"

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
}
export default meta

type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  args: { className: "h-4 w-48 rounded-tag" },
}

export const Circle: Story = {
  args: { className: "size-10 rounded-full" },
}

export const Pill: Story = {
  args: { className: "h-9 w-32 rounded-pill" },
}

export const ShapeFeaturedCard: Story = {
  name: "Shape · Featured card",
  render: () => (
    <div className="grid w-full max-w-md">
      <FeaturedCardSkeleton />
    </div>
  ),
}

export const ShapeVaultTable: Story = {
  name: "Shape · Vault table",
  render: () => (
    <div className="w-full max-w-3xl">
      <VaultTableSkeleton rows={5} />
    </div>
  ),
}

export const ShapeNavChart: Story = {
  name: "Shape · NAV chart",
  render: () => (
    <div className="w-full max-w-3xl">
      <NavChartSkeleton height={320} />
    </div>
  ),
}

export const ShapeNavChartNoControls: Story = {
  name: "Shape · NAV chart (no controls)",
  render: () => (
    <div className="w-full max-w-3xl">
      <NavChartSkeleton height={280} withControls={false} />
    </div>
  ),
}

export const ShapeDepositPanel: Story = {
  name: "Shape · Deposit panel",
  render: () => (
    <div className="w-full max-w-sm rounded-card border border-hairline bg-surface p-6">
      <DepositPanelSkeleton />
    </div>
  ),
}

export const ShapeCompositionList: Story = {
  name: "Shape · Composition list",
  render: () => (
    <div className="w-full max-w-2xl">
      <CompositionListSkeleton rows={5} />
    </div>
  ),
}

export const ReducedMotion: Story = {
  name: "prefers-reduced-motion",
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <p className="text-body-sm text-ink-muted">
        Skeletons honor <code>motion-reduce:animate-none</code>; toggle DevTools
        emulation to verify.
      </p>
      <Skeleton className="h-12 w-full rounded-tag" />
      <Skeleton className="h-12 w-2/3 rounded-tag" />
    </div>
  ),
}
