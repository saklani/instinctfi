import { Outlet, createRootRoute, useRouterState } from "@tanstack/react-router"

import { Toaster } from "@/components/ui/sonner"
import { Nav } from "@/components/nav"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ApiProvider } from "@/components/api-provider"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const location = useRouterState({ select: (s) => s.location })

  return (
    <ApiProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex flex-1 w-full justify-center">
          <div key={location.pathname} className="w-full max-w-7xl px-6 lg:px-16">
            <Outlet />
          </div>
        </main>
        <Footer />
        <Toaster position="top-center" />
        <Nav />
      </div>
    </ApiProvider>
  )
}
