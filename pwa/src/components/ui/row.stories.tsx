import type { Meta, StoryObj } from "@storybook/react-vite"
import { Row } from "./row"
import { Badge } from "./badge"
import { Button } from "./button"

const meta: Meta<typeof Row> = {
  title: "UI/Row",
  component: Row,
}
export default meta

type Story = StoryObj<typeof Row>

export const Default: Story = {
  render: () => (
    <Row>
      <Badge variant="secondary">NVDAx</Badge>
      <Badge variant="secondary">GOOGLx</Badge>
      <Badge variant="secondary">AMZNx</Badge>
    </Row>
  ),
}

export const SpaceBetween: Story = {
  render: () => (
    <Row className="items-center justify-between max-w-sm">
      <span className="text-sm text-muted-foreground">Invested</span>
      <span className="text-sm font-semibold">$5.00</span>
    </Row>
  ),
}

export const PresetButtons: Story = {
  render: () => (
    <Row className="gap-2 max-w-sm">
      {[10, 25, 50, 100].map((n) => (
        <Button key={n} variant="outline" size="sm" className="flex-1">${n}</Button>
      ))}
    </Row>
  ),
}
