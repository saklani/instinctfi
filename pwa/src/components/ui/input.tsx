import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  [
    "w-full min-w-0 bg-clip-padding outline-none",
    "transition-[background-color,border-color,box-shadow] duration-200 ease-out",
    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-body-sm file:font-medium file:text-ink",
    "placeholder:text-ink-faint",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
  ],
  {
    variants: {
      variant: {
        default:
          "border border-input bg-input/30 rounded-input px-3 text-body focus-visible:bg-surface focus-visible:border-accent/50 focus-visible:ring-[4px] focus-visible:ring-accent/25",
        pill:
          "border border-transparent bg-secondary rounded-pill px-4 text-body focus-visible:bg-surface focus-visible:border-accent/50 focus-visible:ring-[4px] focus-visible:ring-accent/25",
        search:
          "border border-transparent bg-secondary rounded-pill pl-10 pr-3 text-body focus-visible:bg-surface focus-visible:border-accent/50 focus-visible:ring-[4px] focus-visible:ring-accent/25",
      },
      size: {
        default: "h-10",
        sm: "h-9",
        lg: "h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type InputProps = Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>

function Input({ className, variant, size, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant ?? "default"}
      className={cn(inputVariants({ variant, size }), className)}
      {...props}
    />
  )
}

type SearchInputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: VariantProps<typeof inputVariants>["size"]
  shortcut?: React.ReactNode
}

function SearchInput({
  className,
  size = "lg",
  shortcut,
  placeholder = "Search vaults",
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full max-w-[450px]", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      />
      <input
        type="search"
        data-slot="search-input"
        placeholder={placeholder}
        className={cn(
          inputVariants({ variant: "search", size }),
          shortcut && "pr-12"
        )}
        {...props}
      />
      {shortcut && (
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-tag border border-hairline bg-surface px-1.5 py-0.5 text-mono-sm text-ink-muted">
          {shortcut}
        </span>
      )}
    </div>
  )
}

export { Input, SearchInput, inputVariants }
