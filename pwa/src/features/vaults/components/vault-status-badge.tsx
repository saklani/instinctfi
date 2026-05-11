import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type VaultStatusBadgeProps = {
  live: boolean
  /** When true, collapses to a dot-only indicator on mobile (md+ shows full badge). */
  compact?: boolean
  className?: string
}

export function VaultStatusBadge({
  live,
  compact = false,
  className,
}: VaultStatusBadgeProps) {
  if (compact) {
    return (
      <>
        <span
          className={cn("inline-flex shrink-0 items-center md:hidden", className)}
          aria-label={live ? "Live" : "Coming soon"}
          role="img"
        >
          <StatusDot live={live} />
        </span>
        <span className={cn("hidden md:inline-flex", className)}>
          <FullBadge live={live} />
        </span>
      </>
    )
  }

  return (
    <span className={cn("inline-flex", className)}>
      <FullBadge live={live} />
    </span>
  )
}

function FullBadge({ live }: { live: boolean }) {
  if (live) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 bg-background text-foreground border-border"
      >
        <StatusDot live />
        <span className="uppercase tracking-wider">Live</span>
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      <span className="uppercase tracking-wider">Coming soon</span>
    </Badge>
  )
}

function StatusDot({ live }: { live: boolean }) {
  if (live) {
    return (
      <span className="relative inline-flex size-1.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-positive opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-positive" />
      </span>
    )
  }
  return <span className="inline-flex size-1.5 rounded-full bg-muted-foreground/60" />
}
