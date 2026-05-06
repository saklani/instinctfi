import * as React from "react"

import { cn } from "@/lib/utils"

function Section({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="section"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

type SectionHeaderProps = React.ComponentProps<"header"> & {
  title: React.ReactNode
  meta?: React.ReactNode
}

function SectionHeader({
  className,
  title,
  meta,
  ...props
}: SectionHeaderProps) {
  return (
    <header
      data-slot="section-header"
      className={cn("flex items-baseline justify-between", className)}
      {...props}
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {meta != null && (
        <span className="font-mono text-xs tabular-nums text-muted-foreground/70">
          {meta}
        </span>
      )}
    </header>
  )
}

export { Section, SectionHeader }
