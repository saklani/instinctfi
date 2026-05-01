import { Link } from "@tanstack/react-router"
import { Compass, PieChart, Settings } from "lucide-react"

const tabs = [
  { to: "/", label: "Discover", icon: Compass },
  { to: "/portfolio", label: "Portfolio", icon: PieChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const

export function Nav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-canvas/90 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] md:hidden">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-around px-4">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group inline-flex flex-col items-center gap-1 rounded-pill px-4 py-1 text-ink-muted outline-none transition-colors duration-150 [&.active]:text-ink focus-visible:ring-[3px] focus-visible:ring-accent/30"
          >
            <Icon className="size-5" />
            <span className="text-pill font-semibold uppercase tracking-[0.06em] [.group.active_&]:text-ink">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
