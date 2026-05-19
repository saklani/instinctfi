import { Link } from "@tanstack/react-router"
import { Activity, Compass, PieChart, Settings, Trophy } from "lucide-react"

const tabs = [
  { to: "/", label: "Discover", icon: Compass },
  { to: "/portfolio", label: "Portfolio", icon: PieChart },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/settings", label: "Settings", icon: Settings },
] as const

export function Nav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-sm md:hidden">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-around">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center text-muted-foreground transition-colors [&.active]:text-foreground"
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
