import { useEffect, type ReactNode } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { setAccessTokenGetter } from "@/lib/api"

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = usePrivy()

  useEffect(() => {
    setAccessTokenGetter(getAccessToken)
  }, [getAccessToken])

  return <>{children}</>
}
