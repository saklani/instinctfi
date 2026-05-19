import { useEffect, type ReactNode } from "react"
import { usePrivy } from "@privy-io/react-auth"

import { setAccessTokenGetter } from "@/lib/api"

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = usePrivy()

  // Sync Privy's token getter into the api module so `request()` (called
  // outside React) can attach a fresh bearer to every fetch.
  useEffect(() => {
    setAccessTokenGetter(getAccessToken)
  }, [getAccessToken])

  return <>{children}</>
}
