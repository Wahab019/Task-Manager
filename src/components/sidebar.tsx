"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useEffect, useState } from "react";
import { getTimeBasedGreeting } from "@/lib/utils";
import {
  ChartNoAxesColumn,
  Clock3,
  LayoutDashboard,
  LogOut,
  TimerReset,
} from "lucide-react";

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Tasks", icon: TimerReset, href: "/tasks" },
  { label: "Time Logs", icon: Clock3, href: "/time-logs" },
  { label: "Reports", icon: ChartNoAxesColumn, href: "/reports" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { isOpen, close } = useSidebar();
  const name = user?.name || user?.email?.split("@")[0] || "User";
  const [greeting, setGreeting] = useState("Good morning");
  const firstName = name.split(" ")[0];

  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
    const interval = setInterval(
      () => setGreeting(getTimeBasedGreeting()),
      60_000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={[
          "fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ease-in-out",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={[
          // Base styles
          "fixed top-0 left-0 z-30 flex min-h-full lg:max-h-screen flex-col border-r border-[#e5e7e3] bg-[#faf9f7] py-4 text-[#5f6762]",
          "transform-gpu overflow-hidden motion-safe:transition-[width,transform] motion-safe:duration-300 motion-safe:ease-in-out motion-safe:will-change-transform",
          // Desktop behaviour: icon-only (w-16) vs expanded (w-56)
          "lg:relative lg:translate-x-0 lg:shrink-0",
          isOpen ? "lg:w-56" : "lg:w-16",
          // Mobile behaviour: fully off-screen vs fully visible (w-64)
          isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
          "lg:translate-x-0", // always visible on desktop (transform handled by width)
        ].join(" ")}
      >
        {/* Navigation */}
        <nav
          className="mt-6 flex-1 space-y-1 px-2"
          aria-label="Main navigation"
        >
          {navigationItems.map(({ label, icon: Icon, href }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={label}
                href={href}
                onClick={() => {
                  // On mobile, close sidebar after navigation
                  if (window.innerWidth < 1024) close();
                }}
                title={!isOpen ? label : undefined}
                className={[
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-[#f0f3f0] text-primary"
                    : "text-[#707772] hover:bg-[#f0f3f0] hover:text-primary",
                ].join(" ")}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2} />
                <span
                  className={[
                    "whitespace-nowrap overflow-hidden transition-all duration-300",
                    isOpen
                      ? "opacity-100 max-w-50"
                      : "opacity-0 max-w-0 lg:max-w-0",
                  ].join(" ")}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto space-y-1 border-t border-[#efefec] pt-4 px-2">
          {isOpen && (
            <div className="px-3 py-1 text-[11px] font-medium text-[#707772] truncate">
              {greeting}, {firstName}
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            title={!isOpen ? "Logout" : undefined}
            className="flex h-8 w-full items-center gap-3 px-3 text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer rounded-md hover:bg-red-50"
          >
            <LogOut className="size-4 shrink-0" />
            <span
              className={[
                "whitespace-nowrap overflow-hidden transition-all duration-300",
                isOpen
                  ? "opacity-100 max-w-50"
                  : "opacity-0 max-w-0 lg:max-w-0",
              ].join(" ")}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
