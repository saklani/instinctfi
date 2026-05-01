import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap select-none",
    "border border-transparent bg-clip-padding font-medium",
    "transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out",
    "outline-none focus-visible:ring-[4px] focus-visible:ring-accent/30 focus-visible:border-accent/50",
    "active:translate-y-px active:duration-[80ms]",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-cta text-cta-ink shadow-cta hover:bg-cta/92 active:shadow-cta-active",
        "primary-accent":
          "bg-accent text-accent-ink shadow-cta hover:bg-accent/92 active:shadow-cta-active",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/75 aria-expanded:bg-secondary",
        ghost:
          "bg-transparent text-ink hover:bg-secondary aria-expanded:bg-secondary",
        outline:
          "border-hairline bg-transparent text-ink hover:bg-secondary",
        icon:
          "bg-transparent text-ink hover:border-hairline hover:bg-surface",
        // Legacy aliases — keep existing pages working without page-level edits
        default:
          "bg-cta text-cta-ink shadow-cta hover:bg-cta/92 active:shadow-cta-active",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20",
        link: "text-ink underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-10 gap-2 rounded-pill px-5 text-body-sm",
        xs: "h-7 gap-1 rounded-pill px-3 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-pill px-4 text-body-sm",
        lg: "h-12 gap-2 rounded-pill px-6 text-body",
        icon: "size-9 rounded-full p-0 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-7 rounded-full p-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-full p-0",
        "icon-lg": "size-11 rounded-full p-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
