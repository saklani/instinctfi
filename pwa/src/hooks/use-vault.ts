import { useEffect, useState } from "react"
import { fetchVaults, type Vault } from "@/lib/api"

export function useVaults() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchVaults()
        if (!cancelled) setVaults(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 30_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return { vaults, loading, error }
}

export function useVault(id: string) {
  const [vault, setVault] = useState<Vault | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const { fetchVault } = await import("@/lib/api")
        const data = await fetchVault(id)
        if (!cancelled) setVault(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 30_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [id])

  return { vault, loading, error }
}
