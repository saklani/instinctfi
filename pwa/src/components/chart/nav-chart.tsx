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

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { NavPoint as ChartPoint } from "@/features/vaults/hooks/use-vault-nav"

export type { ChartPoint }

type NavChartProps = {
  data: ChartPoint[]
  /** Forces remount on change so the line re-strokes. */
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
  /** Stroke/fill color for the line, area gradient, and active dot. */
  accentColor?: string
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
    <div className="rounded-md border border-border bg-card shadow-sm">
      <div className="font-mono text-xs text-muted-foreground">
        {formatDate(String(label))}
      </div>
      <div className="font-mono text-sm font-medium tabular-nums text-foreground">
        {formatValue(point.value)}
      </div>
    </div>
  )
}

function ActiveDot({
  cx,
  cy,
  color,
}: {
  cx?: number
  cy?: number
  color: string
}) {
  if (cx == null || cy == null) return null
  return (
    <g pointerEvents="none">
      <circle cx={cx} cy={cy} r={10} fill={color} fillOpacity={0.1} />
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        stroke="var(--card)"
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
  accentColor = "var(--foreground)",
}: NavChartProps) {
  const gradientId = React.useId()
  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div
        className="relative w-full"
        style={{ height: height ?? 320 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            key={periodKey ?? "default"}
            data={data}
            margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity={0.08} />
                <stop offset="80%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={48}
              tick={{
                fill: "var(--muted-foreground)",
                fontSize: 12,
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
                fill: "var(--muted-foreground)",
                fontSize: 12,
              }}
              tickFormatter={(value) => defaultFormatValue(Number(value))}
              domain={["auto", "auto"]}
            />
            <Tooltip
              cursor={{
                stroke: "var(--muted-foreground)",
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
              fill={`url(#${gradientId})`}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={accentColor}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={<ActiveDot color={accentColor} />}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {(periodSelector || toolbar) && (
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center">{periodSelector}</div>
          <div className="ml-auto flex items-center">{toolbar}</div>
        </div>
      )}
    </div>
  )
}

export function NavChartSkeleton({
  height,
  className,
}: {
  height?: number
  className?: string
}) {
  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="relative w-full" style={{ height: height ?? 320 }}>
        <Skeleton className="size-full rounded-md" />
      </div>
    </div>
  )
}
