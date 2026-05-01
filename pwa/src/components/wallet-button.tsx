import * as React from "react"
import { ChevronDown, Copy, LogOut, Settings as SettingsIcon, Wallet } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWallet } from "@/hooks/use-wallet"
import { truncateAddress } from "@/lib/format"
import { cn } from "@/lib/utils"

type ConnectedPillProps = {
  address: string
  compact?: boolean
  onCopy?: () => void
  onDisconnect?: () => void
  className?: string
}

/**
 * Visual + interactive pill for the connected wallet state.
 * Exposed standalone so Storybook (and tests) can render without Privy context.
 */
export function ConnectedWalletPill({
  address,
  compact = false,
  onCopy,
  onDisconnect,
  className,
}: ConnectedPillProps) {
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address)
      toast.success("Address copied")
    } catch {
      toast.error("Could not copy address")
    }
    onCopy?.()
  }, [address, onCopy])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex h-9 items-center gap-2 rounded-pill border border-hairline bg-surface pl-1 pr-3 text-body-sm text-ink",
            "transition-[background-color,border-color] duration-200 ease-out",
            "hover:bg-secondary",
            "outline-none focus-visible:ring-[4px] focus-visible:ring-accent/30 focus-visible:border-accent/50",
            "data-[state=open]:bg-secondary",
            compact && "px-2",
            className
          )}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-ink">
            <Wallet className="size-3.5" />
          </span>
          {!compact && (
            <>
              <span className="font-mono tabular-nums">
                {truncateAddress(address)}
              </span>
              <ChevronDown className="size-3.5 text-ink-muted transition-transform group-data-[state=open]:rotate-180" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <div className="px-3 pb-2 pt-2 text-mono-sm text-ink-muted">
          {truncateAddress(address)}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleCopy}>
          <Copy />
          Copy address
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <SettingsIcon />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDisconnect?.()}
        >
          <LogOut />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type DisconnectedPillProps = {
  compact?: boolean
  onConnect?: () => void
  className?: string
}

export function DisconnectedWalletPill({
  compact = false,
  onConnect,
  className,
}: DisconnectedPillProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onConnect?.()}
      className={cn("gap-2", className)}
    >
      <Wallet className="size-4" />
      {!compact && "Connect Wallet"}
    </Button>
  )
}

type WalletButtonProps = {
  className?: string
  /** When true, only renders the avatar (no address text). */
  compact?: boolean
}

export function WalletButton({ className, compact = false }: WalletButtonProps) {
  const { ready, authenticated, walletAddress, login, logout } = useWallet()

  if (!ready) {
    return (
      <div
        aria-hidden
        className={cn(
          "h-9 w-32 animate-pulse rounded-pill bg-secondary",
          compact && "w-9",
          className
        )}
      />
    )
  }

  if (!authenticated || !walletAddress) {
    return (
      <DisconnectedWalletPill
        compact={compact}
        onConnect={login}
        className={className}
      />
    )
  }

  return (
    <ConnectedWalletPill
      address={walletAddress}
      compact={compact}
      onDisconnect={logout}
      className={className}
    />
  )
}
