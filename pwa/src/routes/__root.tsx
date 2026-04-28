import { Outlet, createRootRoute } from "@tanstack/react-router"
import { Toaster } from "@/components/ui/sonner"
import { Nav } from "@/components/nav"
import { InstallBanner } from "@/components/install-banner"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-2xl items-center px-4">
          <span className="text-base font-bold tracking-tight">Instinct</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        <Outlet />
      </main>
      <Toaster />
      <InstallBanner />
      <Nav />
    </div>
  )
}
