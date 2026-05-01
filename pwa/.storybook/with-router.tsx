import * as React from "react"
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"

const Empty = () => null

/**
 * Wraps a Storybook story in a TanStack memory router so components that use
 * `<Link>` can render in isolation.
 */
export function withRouter(initialPath = "/") {
  return (Story: React.ComponentType) => {
    const router = React.useMemo(() => {
      const root = createRootRoute({ component: () => <Story /> })
      const tree = root.addChildren([
        createRoute({ getParentRoute: () => root, path: "/", component: Empty }),
        createRoute({ getParentRoute: () => root, path: "/portfolio", component: Empty }),
        createRoute({ getParentRoute: () => root, path: "/settings", component: Empty }),
      ])
      return createRouter({
        routeTree: tree,
        history: createMemoryHistory({ initialEntries: [initialPath] }),
      })
    }, [initialPath, Story])
    return <RouterProvider router={router} />
  }
}
