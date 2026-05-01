import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card"
import { Button } from "./button"
import { Badge } from "./badge"

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
}
export default meta

type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Pelosi Tracker</CardTitle>
        <CardDescription>Top stocks from Nancy Pelosi&apos;s portfolio.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="ticker" size="md">$NVDA</Badge>
          <Badge variant="ticker" size="md">$GOOGL</Badge>
          <Badge variant="ticker" size="md">$AMZN</Badge>
        </div>
      </CardContent>
    </Card>
  ),
}

export const Interactive: Story = {
  render: () => (
    <Card interactive className="max-w-sm">
      <CardHeader>
        <CardTitle>Magnificent 7</CardTitle>
        <CardDescription>Top 7 US tech equities, equally weighted.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-ink-muted">Hover me — surface lifts.</p>
      </CardContent>
    </Card>
  ),
}

export const SmallSize: Story = {
  render: () => (
    <Card size="sm" className="max-w-sm">
      <CardHeader>
        <CardTitle className="text-body">Your Position</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-ink-muted">Invested</span>
          <span className="text-mono-md">$5.00</span>
        </div>
      </CardContent>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Manage your settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-ink-muted">Connected to Solana Mainnet.</p>
      </CardContent>
      <CardFooter>
        <Button variant="primary" className="w-full">Sign out</Button>
      </CardFooter>
    </Card>
  ),
}
