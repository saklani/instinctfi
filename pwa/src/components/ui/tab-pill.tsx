import * as React from "react"

import { cn } from "@/lib/utils"

type TabPillContextValue = {
  value: string | undefined
  onValueChange: (value: string) => void
  layoutId: string
}

const TabPillContext = React.createContext<TabPillContextValue | null>(null)

function useTabPill() {
  const ctx = React.useContext(TabPillContext)
  if (!ctx) {
    throw new Error("TabPillItem must be rendered inside a <TabPill>")
  }
  return ctx
}

type TabPillProps = React.ComponentProps<"div"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Stable id used by Framer Motion `layoutId` once Phase 2 motion lands. */
  layoutId?: string
}

function TabPill({
  className,
  value: controlledValue,
  defaultValue,
  onValueChange,
  layoutId,
  children,
  ...props
}: TabPillProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue
  const generatedId = React.useId()
  const resolvedLayoutId = layoutId ?? `tab-pill-${generatedId}`

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange]
  )

  return (
    <TabPillContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        layoutId: resolvedLayoutId,
      }}
    >
      <div
        data-slot="tab-pill"
        role="tablist"
        className={cn(
          "inline-flex items-center gap-0.5 rounded-pill bg-secondary p-1",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </TabPillContext.Provider>
  )
}

type TabPillItemProps = Omit<React.ComponentProps<"button">, "value"> & {
  value: string
}

function TabPillItem({
  className,
  value,
  children,
  onClick,
  ...props
}: TabPillItemProps) {
  const ctx = useTabPill()
  const isActive = ctx.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-slot="tab-pill-item"
      data-state={isActive ? "active" : "inactive"}
      data-layout-id={ctx.layoutId}
      onClick={(event) => {
        ctx.onValueChange(value)
        onClick?.(event)
      }}
      className={cn(
        "relative z-10 inline-flex h-8 items-center justify-center rounded-pill px-4 text-body-sm font-medium",
        "transition-colors duration-150 outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-accent/30",
        isActive
          ? "bg-surface text-ink shadow-card"
          : "text-ink-muted hover:text-ink",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export { TabPill, TabPillItem }
