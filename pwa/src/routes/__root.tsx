import { Outlet, createRootRoute, useRouterState } from "@tanstack/react-router"

import { Toaster } from "@/components/ui/sonner"
import { Nav } from "@/components/nav"
import { Header } from "@/components/header"
import { ApiProvider } from "@/components/api-provider"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const location = useRouterState({ select: (s) => s.location })

  return (
    <ApiProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-6xl">
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
