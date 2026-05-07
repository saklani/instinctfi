import { Link } from "@tanstack/react-router"

import { InstallButton } from "@/components/install-button"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/hooks/use-wallet"
import { Row } from "./ui/row"

const desktopLinks = [
  { to: "/", label: "Discover" },
  { to: "/portfolio", label: "Portfolio" },
] as const

export function Header() {
  const { authenticated, login, ready } = useWallet()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <Row className="mx-auto h-16 w-full max-w-6xl items-center px-4 justify-between">
        <Link to="/" aria-label="instinct, home">
          <img src="/logo-black.png" alt="Instinct" className="h-6" />
        </Link>
        <nav className="hidden md:flex gap-4 items-center w-fit">
          {desktopLinks.map(({ to, label }) => (
            <Row className="w-[80px] items-center justify-center">
              <Link
                key={to}
                to={to}
                className="text-sm text-center text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
              >
                {label}
              </Link>
            </Row>
          ))}
          <Button size="sm" onClick={login} className="ml-6">
            Sign in
          </Button>
        </nav>
        <InstallButton />
      </Row>
    </header>
  )
}
