/**
 * US equity market hours: 9:30 AM – 4:00 PM ET, Mon–Fri.
 * Holidays not handled — the underlying Symmetry / xStock txs will fail
 * gracefully on a closed-market day; this gate is a UX hint, not a contract.
 */

const MARKET_OPEN_MINUTES = 9 * 60 + 30 // 9:30 AM ET
const MARKET_CLOSE_MINUTES = 16 * 60 // 4:00 PM ET

function nyParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now)
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? ""
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0)
  return { weekday, minutes: hour * 60 + minute }
}

export function isMarketOpen(now: Date = new Date()): boolean {
  const { weekday, minutes } = nyParts(now)
  if (weekday === "Sat" || weekday === "Sun") return false
  return minutes >= MARKET_OPEN_MINUTES && minutes < MARKET_CLOSE_MINUTES
}

export function marketStatusText(now: Date = new Date()): string | null {
  return isMarketOpen(now) ? null : "US Markets closed"
}
