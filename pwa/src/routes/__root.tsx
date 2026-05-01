import { Outlet, createRootRoute, useRouterState } from "@tanstack/react-router"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { Toaster } from "@/components/ui/sonner"
import { Nav } from "@/components/nav"
import { TopNav } from "@/components/top-nav"
import { ApiProvider } from "@/components/api-provider"
import { durations, outQuart } from "@/components/motion/easings"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const location = useRouterState({ select: (s) => s.location })
  const reduce = useReducedMotion()

  return (
    <ApiProvider>
      <div className="relative min-h-screen bg-canvas text-ink">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-canvas-glow"
        />
        <TopNav />
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-6 md:pb-12">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: durations.route, ease: outQuart }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <Toaster position="top-center" />
        <Nav />
      </div>
    </ApiProvider>
  )
}
