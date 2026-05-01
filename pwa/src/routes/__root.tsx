import { Link, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router"
import { Toaster } from "@/components/ui/sonner"
import { Nav } from "@/components/nav"
import { ApiProvider } from "@/components/api-provider"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const location = useRouterState({ select: (s) => s.location })

  return (
    <ApiProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
            <Link to="/"><img src="/logo-black.png" alt="Instinct" className="h-6" /></Link>
            <nav className="ml-auto hidden items-center gap-1 md:flex">
              <Link to="/" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-medium">Discover</Link>
              <Link to="/portfolio" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-medium">Portfolio</Link>
              <Link to="/settings" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-medium">Settings</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 pb-24 pt-4 md:pb-4">
          <div key={location.pathname} className="animate-in fade-in-0 duration-200">
            <Outlet />
          </div>
        </main>
        <Toaster position="top-center" />
        <Nav />
      </div>
    </ApiProvider>
  )
}
