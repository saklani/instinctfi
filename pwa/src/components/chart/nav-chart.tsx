import * as React from "react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import { durations } from "@/components/motion/easings"

export type ChartPoint = {
  date: string
  value: number
}

type NavChartProps = {
  data: ChartPoint[]
  /** Forces remount on change so the line re-strokes. Pass the active period id. */
  periodKey?: string
  /** Slot rendered below-left (typically time-period pills). */
  periodSelector?: React.ReactNode
  /** Slot rendered below-right (typically share/camera icon button). */
  toolbar?: React.ReactNode
  formatValue?: (value: number) => string
  formatDate?: (date: string) => string
  className?: string
  /** Override container height. Defaults to 320 (md) / 280 (sm). */
  height?: number
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const usdCompactFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

function defaultFormatValue(value: number) {
  return Math.abs(value) >= 10_000
    ? usdCompactFormatter.format(value)
    : usdFormatter.format(value)
}

function defaultFormatDate(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : dateFormatter.format(d)
}

function defaultFormatTooltipDate(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : fullDateFormatter.format(d)
}

type TooltipProps = {
  active?: boolean
  label?: string | number
  payload?: Array<{ value: number; payload: ChartPoint }>
  formatValue: (value: number) => string
  formatDate: (date: string) => string
}

function NavChartTooltip({
  active,
  label,
  payload,
  formatValue,
  formatDate,
}: TooltipProps) {
  if (!active || !payload?.length || label == null) return null
  const point = payload[0]
  return (
    <div
      data-slot="nav-chart-tooltip"
      className="rounded-tag border border-hairline bg-surface px-3 py-2 shadow-card"
    >
      <div className="text-mono-sm text-ink-muted">{formatDate(String(label))}</div>
      <div className="font-mono text-mono-md font-medium text-ink tabular">
        {formatValue(point.value)}
      </div>
    </div>
  )
}

function ActiveDot({ cx, cy }: { cx?: number; cy?: number }) {
  if (cx == null || cy == null) return null
  return (
    <g pointerEvents="none">
      <circle cx={cx} cy={cy} r={10} fill="var(--accent)" fillOpacity={0.18} />
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--accent)"
        stroke="var(--surface)"
        strokeWidth={1.5}
      />
    </g>
  )
}

export function NavChart({
  data,
  periodKey,
  periodSelector,
  toolbar,
  formatValue = defaultFormatValue,
  formatDate = defaultFormatTooltipDate,
  className,
  height,
}: NavChartProps) {
  const reduce = useReducedMotion()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    const node = containerRef.current
    if (!node) return
    if (typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const animationActive = inView && !reduce
  const lineMs = Math.round(durations.chartLine * 1000)
  const areaMs = Math.round(durations.chartArea * 1000)

  return (
    <div
      ref={containerRef}
      data-slot="nav-chart"
      className={cn("flex w-full flex-col gap-4", className)}
    >
      <div
        className="relative w-full"
        style={{ height: height ?? 320 }}
      >
        {inView ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              key={periodKey ?? "default"}
              data={data}
              margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="nav-chart-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} />
                  <stop offset="80%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--hairline)"
                strokeDasharray="3 4"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={48}
                tick={{
                  fill: "var(--ink-faint)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
                tickFormatter={defaultFormatDate}
              />
              <YAxis
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickCount={5}
                tickMargin={8}
                width={64}
                tick={{
                  fill: "var(--ink-faint)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
                tickFormatter={(value) => defaultFormatValue(Number(value))}
                domain={["auto", "auto"]}
              />
              <Tooltip
                cursor={{
                  stroke: "var(--ink-faint)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
                content={(tooltipProps) => {
                  const { active, payload, label } =
                    tooltipProps as unknown as TooltipProps
                  return (
                    <NavChartTooltip
                      active={active}
                      payload={payload}
                      label={label}
                      formatValue={formatValue}
                      formatDate={formatDate}
                    />
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill="url(#nav-chart-area)"
                isAnimationActive={animationActive}
                animationDuration={areaMs}
                animationBegin={lineMs}
                animationEasing="ease-out"
                activeDot={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--accent)"
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                isAnimationActive={animationActive}
                animationDuration={lineMs}
                animationEasing="ease-out"
                activeDot={<ActiveDot />}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="size-full rounded-tag bg-surface-muted/40" />
        )}
      </div>

      {(periodSelector || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center">{periodSelector}</div>
          <div className="ml-auto flex items-center">{toolbar}</div>
        </div>
      )}
    </div>
  )
}
