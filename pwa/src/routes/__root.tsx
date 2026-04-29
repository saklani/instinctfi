import { Outlet, createRootRoute } from "@tanstack/react-router"
import { Toaster } from "@/components/ui/sonner"
import { Nav } from "@/components/nav"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-6">
          <img src="/logo-black.png" alt="Instinct" className="h-6" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        <Outlet />
      </main>
      <Toaster />
      <Nav />
    </div>
  )
}
