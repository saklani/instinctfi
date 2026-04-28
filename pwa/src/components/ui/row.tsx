import { cn } from "@/lib/utils"

export function Row({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-row gap-2", className)} {...props} />
}
