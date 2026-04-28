import { useUsdcBalance } from "@/hooks/use-usdc-balance"
import { cn } from "@/lib/utils"

export function UsdcBalance({ className }: { className?: string }) {
  const { balance, loading } = useUsdcBalance()

  if (loading && balance === null) return <span className={cn("text-muted-foreground", className)}>...</span>
  if (balance === null) return <span className={cn("text-muted-foreground", className)}>—</span>

  return <span className={className}>${balance.toFixed(2)}</span>
}
