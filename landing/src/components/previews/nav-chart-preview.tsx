import * as React from "react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

const POINTS = [
  100, 102, 99, 104, 101, 107, 110, 108, 113, 116, 114, 118, 122, 119, 124,
  128, 126, 131, 134, 132, 137, 142, 140, 145, 149, 147, 152, 156, 154, 159,
]

type NavChartPreviewProps = {
  className?: string
  values?: number[]
  latestNav?: number
  label?: string
  periodLabel?: string
  startInvestment?: number
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const usdWholeFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export function NavChartPreview({
  className,
  values,
  latestNav,
  label,
  periodLabel,
  startInvestment,
}: NavChartPreviewProps) {
  const series = values && values.length > 1 ? values : POINTS
  const latest = latestNav ?? series[series.length - 1]
  const start = series[0]
  const periodPct = start > 0 ? ((latest - start) / start) * 100 : 0
  const periodPositive = periodPct >= 0
  const span = series.length
  const computedPeriod =
    periodLabel ??
    (span >= 300 ? "1Y" : span >= 60 ? "3M" : span >= 25 ? "1M" : `${span}d`)

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex flex-col gap-1">
            {label && (
              <span className="text-xs uppercase tracking-wider text-muted-foreground/70">
                {label}
              </span>
            )}
            <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
              {usdFormatter.format(latest)}
            </span>
            {startInvestment !== undefined && (
              <span className="text-xs text-muted-foreground">
                {usdWholeFormatter.format(startInvestment)} invested · {computedPeriod}
              </span>
            )}
          </div>
          <span
            className={cn(
              "inline-flex items-baseline rounded-md px-2 py-1 text-sm font-medium",
              periodPositive
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-red-500/10 text-red-600",
            )}
          >
            {periodPositive ? "+" : ""}{periodPct.toFixed(2)}%
          </span>
        </div>

        <Chart values={series} />
      </div>
    </Card>
  )
}

function Chart({
  values,
  width = 640,
  height = 180,
}: {
  values: number[]
  width?: number
  height?: number
}) {
  const id = React.useId()
  const gradId = `nav-fill-${id}`
  const padTop = 12
  const padBottom = 12
  const padLeft = 0
  const padRight = 0

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const innerW = width - padLeft - padRight
  const innerH = height - padTop - padBottom
  const step = innerW / Math.max(values.length - 1, 1)

  const points = values.map((v, i) => {
    const x = padLeft + i * step
    const y = padTop + innerH - ((v - min) / range) * innerH
    return [x, y] as const
  })

  const linePath = points
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ")
  const areaPath = `${linePath} L ${points[points.length - 1][0]} ${padTop + innerH} L ${points[0][0]} ${padTop + innerH} Z`

  const gridLines = 3
  const yLines = Array.from({ length: gridLines + 1 }, (_, i) => {
    return padTop + (innerH * i) / gridLines
  })

  const lastPoint = points[points.length - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="none"
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(2,76,199)" stopOpacity={0.24} />
          <stop offset="80%" stopColor="rgb(2,76,199)" stopOpacity={0} />
        </linearGradient>
      </defs>

      {yLines.map((y, i) => (
        <line
          key={i}
          x1={padLeft}
          x2={width - padRight}
          y1={y}
          y2={y}
          stroke="var(--border)"
          strokeDasharray="3 4"
        />
      ))}

      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="rgb(2,76,199)"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx={lastPoint[0]} cy={lastPoint[1]} r={9} fill="rgb(2,76,199)" fillOpacity={0.18} />
      <circle
        cx={lastPoint[0]}
        cy={lastPoint[1]}
        r={4}
        fill="rgb(2,76,199)"
        stroke="var(--card)"
        strokeWidth={1.5}
      />
    </svg>
  )
}
