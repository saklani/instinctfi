import { Link } from "@tanstack/react-router"

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-base font-bold tracking-tight">
            Instinct
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors [&.active]:text-foreground [&.active]:font-medium"
            >
              Discover
            </Link>
            <Link
              to="/portfolio"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors [&.active]:text-foreground [&.active]:font-medium"
            >
              Portfolio
            </Link>
            <Link
              to="/settings"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors [&.active]:text-foreground [&.active]:font-medium"
            >
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
