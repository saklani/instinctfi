import type { Meta, StoryObj } from "@storybook/react-vite"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card"
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
        <CardDescription>Top stocks from Nancy Pelosi's portfolio</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">NVDAx 22%</Badge>
          <Badge variant="secondary">GOOGLx 17%</Badge>
          <Badge variant="secondary">AMZNx 13%</Badge>
        </div>
      </CardContent>
    </Card>
  ),
}

export const SmallSize: Story = {
  render: () => (
    <Card size="sm" className="max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">Your Position</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Invested</span>
          <span className="text-sm font-semibold">$5.00</span>
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
        <CardDescription>Manage your settings</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Connected to Solana Mainnet</p>
      </CardContent>
      <CardFooter>
        <Button variant="destructive" className="w-full">Sign Out</Button>
      </CardFooter>
    </Card>
  ),
}
