import { lazy, Suspense, type ReactNode } from "react"

const PrivyProviderInner = lazy(() =>
  import("./privy-provider-inner").then((m) => ({
    default: m.PrivyProviderInner,
  })),
)

export function LazyPrivyProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PrivyProviderInner>{children}</PrivyProviderInner>
    </Suspense>
  )
}
