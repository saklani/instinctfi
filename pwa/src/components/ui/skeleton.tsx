import { cn } from "@/lib/utils"

function Skeleton({
  className,
  style,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse bg-muted motion-reduce:animate-none",
        className
      )}
      style={{ animationDuration: "2s", ...style }}
      {...props}
    />
  )
}

export { Skeleton }
