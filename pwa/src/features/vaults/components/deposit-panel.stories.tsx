import type { Meta, StoryObj } from "@storybook/react-vite"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import {
  DepositPanelHistoryView,
  DepositPanelWithdrawView,
  DepositSuccessState,
} from "./deposit-panel"
import { Card } from "@/components/ui/card"
import type { Order } from "@/features/orders/api"
import type { Vault } from "@/features/vaults/api"

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
})

const meta: Meta = {
  title: "Features/DepositPanel",
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
}
export default meta

type Story = StoryObj

const sampleVault = {
  id: "vault-mag7",
  name: "Magnificent 7",
  depositFeeBps: 50,
  withdrawFeeBps: 75,
} satisfies Pick<Vault, "id" | "name" | "depositFeeBps" | "withdrawFeeBps">

const sampleOrders: Order[] = [
  {
    id: "1",
    vaultId: sampleVault.id,
    type: "deposit",
    amount: "5000000",
    status: "completed",
    signature: "3RekpfgTVCwNLrxrWtVVKwRLAC4wvCruJmE6sA9Ve5LjGmRnP5Vcf1ipo5GmiYkK8izvSytSFA3CMLND3LqRC1EW",
    createdAt: "2026-04-30T14:42:00Z",
  },
  {
    id: "2",
    vaultId: sampleVault.id,
    type: "deposit",
    amount: "10000000",
    status: "processing",
    signature: "5RekpfgTVCwNLrxrWtVVKwRLAC4wvCruJmE6sA9Ve5LjGmRnP5Vcf1ipo5GmiYkK8izvSytSFA3CMLND3LqRC1EW",
    createdAt: "2026-04-25T10:14:00Z",
  },
  {
    id: "3",
    vaultId: sampleVault.id,
    type: "withdraw",
    amount: "2500000",
    status: "failed",
    signature: null,
    createdAt: "2026-04-19T08:01:00Z",
  },
]

export const SuccessState: Story = {
  render: () => (
    <Card className="w-[360px]">
      <DepositSuccessState amount={250} />
    </Card>
  ),
}

export const SuccessStateLargeAmount: Story = {
  render: () => (
    <Card className="w-[360px]">
      <DepositSuccessState amount={12_500} />
    </Card>
  ),
}

export const WithdrawStub: Story = {
  render: () => (
    <Card className="w-[360px]">
      <DepositPanelWithdrawView vault={sampleVault} />
    </Card>
  ),
}

export const HistoryFull: Story = {
  render: () => (
    <Card className="w-[360px]">
      <DepositPanelHistoryView
        vaultId={sampleVault.id}
        ordersOverride={sampleOrders}
      />
    </Card>
  ),
}

export const HistoryEmpty: Story = {
  render: () => (
    <Card className="w-[360px]">
      <DepositPanelHistoryView
        vaultId={sampleVault.id}
        ordersOverride={[]}
      />
    </Card>
  ),
}
