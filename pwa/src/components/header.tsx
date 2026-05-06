import { Link } from "@tanstack/react-router"

import { InstallButton } from "@/components/install-button"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/hooks/use-wallet"

const desktopLinks = [
  { to: "/", label: "Discover" },
  { to: "/portfolio", label: "Portfolio" },
] as const

export function Header() {
  const { authenticated, login, ready } = useWallet()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
        <Link to="/" aria-label="instinct, home">
          <img src="/logo-black.png" alt="Instinct" className="h-6" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {desktopLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <InstallButton />
          {ready && !authenticated && (
            <Button size="sm" onClick={login}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
