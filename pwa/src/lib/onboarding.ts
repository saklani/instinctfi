const STORAGE_KEY = "instinct.onboarding-seen-v1"

export function getOnboardingSeen(): boolean {
  if (typeof window === "undefined") return true
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return true
  }
}

export function setOnboardingSeen(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, "1")
  } catch {
    // localStorage unavailable (private mode, quota) — ignore.
  }
}

export function clearOnboardingSeen(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
