import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap",
    "border border-transparent transition-colors duration-150",
    "focus-visible:ring-[3px] focus-visible:ring-accent/30",
    "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/85",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/75",
        destructive:
          "bg-destructive/12 text-destructive focus-visible:ring-destructive/25 [a]:hover:bg-destructive/20",
        outline:
          "border-hairline bg-transparent text-ink [a]:hover:bg-secondary",
        ghost:
          "bg-transparent text-ink-muted hover:bg-secondary hover:text-ink",
        link: "bg-transparent text-ink underline-offset-4 hover:underline",
        ticker:
          "bg-secondary text-ink font-mono uppercase tabular tracking-[0.04em]",
        count:
          "bg-secondary text-ink-muted uppercase tracking-[0.06em] [a]:hover:bg-secondary/75",
        verified:
          "bg-accent/12 text-accent border-accent/20",
        delta:
          "bg-secondary text-ink font-mono tabular",
        positive:
          "bg-positive/12 text-positive font-mono tabular",
        negative:
          "bg-negative/12 text-negative font-mono tabular",
      },
      size: {
        default: "h-5 rounded-pill px-2 text-[11px] font-medium",
        sm: "h-4 rounded-pill px-1.5 text-[10px] font-medium",
        md: "h-6 rounded-pill px-2.5 text-pill",
        lg: "h-7 rounded-pill px-3 text-pill",
        tag: "h-5 rounded-tag px-1.5 text-[10px] font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
