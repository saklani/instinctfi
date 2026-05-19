// US equities (NYSE/Nasdaq) regular session: weekdays 09:30–16:00 ET.
// DST is handled automatically by IANA zone lookups. US holiday closures
// (Thanksgiving, Christmas etc.) are NOT excluded here — the Jupiter RFQ
// retry loop is the fallback on those days.

export function isUsMarketOpen(now: Date = new Date()): boolean {
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  )
  const day = et.getDay() // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false
  const minutes = et.getHours() * 60 + et.getMinutes()
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60
}

// Next future moment when isUsMarketOpen() returns true. Iterates in
// 5-minute steps (≤ 7 days search window). Used by Inngest workers to
// `step.sleepUntil(...)` so off-hours orders resume at the opening bell
// instead of burning the RFQ retry budget.
export function nextUsMarketOpen(now: Date = new Date()): Date {
  let t = new Date(now.getTime())
  const STEP_MS = 5 * 60_000
  const MAX_STEPS = 7 * 24 * 12 // 1 week
  for (let i = 0; i < MAX_STEPS; i++) {
    t = new Date(t.getTime() + STEP_MS)
    if (isUsMarketOpen(t)) return t
  }
  return new Date(now.getTime() + 24 * 60 * 60_000) // safety fallback
}
