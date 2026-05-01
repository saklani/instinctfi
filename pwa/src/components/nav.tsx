import { Link } from "@tanstack/react-router"
import { Compass, PieChart, Settings } from "lucide-react"

const tabs = [
  { to: "/", label: "Discover", icon: Compass },
  { to: "/portfolio", label: "Portfolio", icon: PieChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const

export function Nav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)] md:hidden">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-around px-4">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors [&.active]:text-foreground"
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
