import { useSolBalance } from "@/hooks/use-sol-balance"
import { cn } from "@/lib/utils"

export function SolBalance({ className }: { className?: string }) {
  const { balance, loading } = useSolBalance()

  if (loading && balance === null) return <span className={cn("text-muted-foreground", className)}>...</span>
  if (balance === null) return <span className={cn("text-muted-foreground", className)}>—</span>

  return <span className={className}>{balance.toFixed(4)} SOL</span>
}
