import type { Meta, StoryObj } from "@storybook/react-vite"
import { OrderCard } from "./order-card"
import type { Order } from "../api"
import { Column } from "@/components/ui/column"

const meta: Meta<typeof OrderCard> = {
  title: "Features/OrderCard",
  component: OrderCard,
}
export default meta

type Story = StoryObj<typeof OrderCard>

const baseOrder: Order = {
  id: "1",
  vaultId: "abc",
  type: "deposit",
  amount: "5000000",
  status: "processing",
  signature: "3RekpfgTVCwNLrxrWtVVKwRLAC4wvCruJmE6sA9Ve5LjGmRnP5Vcf1ipo5GmiYkK8izvSytSFA3CMLND3LqRC1EW",
  createdAt: "2026-04-30T14:42:00Z",
}

export const Processing: Story = {
  args: { order: baseOrder },
}

export const Completed: Story = {
  args: { order: { ...baseOrder, status: "completed" } },
}

export const Failed: Story = {
  args: { order: { ...baseOrder, status: "failed", signature: null } },
}

export const OrderList: Story = {
  render: () => (
    <Column className="gap-3 max-w-sm">
      <OrderCard order={baseOrder} />
      <OrderCard order={{ ...baseOrder, id: "2", status: "completed", amount: "10000000" }} />
      <OrderCard order={{ ...baseOrder, id: "3", status: "failed", signature: null, amount: "2500000" }} />
    </Column>
  ),
}
