/**
 * Easing curves and timing constants shared across motion primitives.
 * `outQuart` is the project default — gentle deceleration that reads
 * as quietly confident rather than bouncy.
 */
export const outQuart = [0.22, 1, 0.36, 1] as const

export const durations = {
  hover: 0.16,
  route: 0.28,
  reveal: 0.32,
  chartLine: 0.7,
  chartArea: 0.4,
  ticker: 0.8,
  stagger: 0.04,
  pathDraw: 0.6,
  checkmark: 0.5,
} as const

export const springs = {
  pill: { type: "spring" as const, stiffness: 360, damping: 28 },
  cta: { type: "spring" as const, stiffness: 280, damping: 30 },
}
