import Link from "next/link";
import {
  ChartNoAxesColumn,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  LogOut,
  Play,
  TimerReset,
  Users,
} from "lucide-react";

const navigationItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    active: true,
  },
  { label: "Tasks", icon: TimerReset },
  { label: "Time Logs", icon: Clock3 },
  { label: "Reports", icon: ChartNoAxesColumn },
  { label: "Team", icon: Users },
];

export function Sidebar() {
  return (
    <aside className="flex min-h-screen w-60 shrink-0 flex-col border-r border-[#e5e7e3] bg-[#faf9f7] px-4 py-4 text-[#5f6762]">
      <Link href="/dashboard" className="flex items-center gap-2 px-1">
        <span className="flex size-6 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-secondary">
          ⏱
        </span>
        <span>
          <span className="block font-heading text-lg leading-4 font-semibold text-primary">
            Task &amp; Time
          </span>
          <span className="block text-[9px] text-[#8b918d]">
            Enterprise Edition
          </span>
        </span>
      </Link>

      <nav className="mt-16 space-y-1" aria-label="Main navigation">
        {navigationItems.map(({ label, icon: Icon, href, active }) => {
          const className = `flex h-10 items-center gap-5 border-r-2 px-2 text-sm font-semibold transition-colors ${
            active
              ? "border-secondary bg-[#f0f3f0] text-primary"
              : "border-transparent text-[#707772] hover:bg-[#f0f3f0] hover:text-primary"
          }`;

          return href ? (
            <Link key={label} href={href} className={className}>
              <Icon className="size-4" strokeWidth={2} />
              {label}
            </Link>
          ) : (
            <span key={label} className={className}>
              <Icon className="size-4" strokeWidth={2} />
              {label}
            </span>
          );
        })}
      </nav>

      <button
        type="button"
        className="mt-auto flex h-10 items-center justify-center gap-3 rounded-[3px] bg-primary text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#0a3026]"
      >
        <Play className="size-3 fill-current" />
        START TIMER
      </button>

      <div className="mt-5 space-y-1 border-t border-[#efefec] pt-4">
        <button
          type="button"
          className="flex h-8 w-full items-center gap-5 px-3 text-xs font-medium hover:text-primary"
        >
          <CircleHelp className="size-4" />
          Support
        </button>
        <Link
          href="/login"
          className="flex h-8 items-center gap-5 px-3 text-xs font-medium hover:text-primary"
        >
          <LogOut className="size-4" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
