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
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-sm">
      <div className="font-mono text-xs text-muted-foreground">
        {formatDate(String(label))}
      </div>
      <div className="font-mono text-sm font-medium tabular-nums text-foreground">
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
}: NavChartProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
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
              <linearGradient id="nav-chart-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} />
                <stop offset="80%" stopColor="var(--accent)" stopOpacity={0} />
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
              fill="url(#nav-chart-area)"
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
              activeDot={<ActiveDot />}
            />
          </ComposedChart>
        </ResponsiveContainer>
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

export function NavChartSkeleton({
  height,
  className,
}: {
  height?: number
  className?: string
}) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div className="relative w-full" style={{ height: height ?? 320 }}>
        <Skeleton className="size-full rounded-md" />
      </div>
    </div>
  )
}
