import * as React from "react"

import { cn } from "@/lib/utils"

type TabPillContextValue = {
  value: string | undefined
  onValueChange: (value: string) => void
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
  /** Ignored — accepted for compatibility with motion-aware versions. */
  layoutId?: string
}

function TabPill({
  className,
  value: controlledValue,
  defaultValue,
  onValueChange,
  layoutId: _layoutId,
  children,
  ...props
}: TabPillProps) {
  void _layoutId
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange],
  )

  return (
    <TabPillContext.Provider
      value={{ value, onValueChange: handleValueChange }}
    >
      <div
        data-slot="tab-pill"
        role="tablist"
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full bg-secondary p-1",
          className,
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
      onClick={(event) => {
        ctx.onValueChange(value)
        onClick?.(event)
      }}
      className={cn(
        "relative inline-flex h-8 items-center justify-center rounded-full text-xs font-medium",
        "transition-colors duration-150 outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-ring",
        isActive
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export { TabPill, TabPillItem }
