import { Loader2 } from "lucide-react"
import { Button, type buttonVariants } from "./button"
import type { VariantProps } from "class-variance-authority"

interface LoadingButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

export function LoadingButton({
  isLoading = false,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  )
}
