import { cn } from "@/lib/utils"

export function Column({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-4", className)} {...props} />
}
