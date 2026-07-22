"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Settings, Timer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getTimeBasedGreeting } from "@/lib/utils";

export function ToolbarButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-primary transition hover:bg-[#eae7e7] [&_svg]:size-4 cursor-pointer"
    >
      {children}
    </button>
  );
}

export const Header = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
    const interval = setInterval(
      () => setGreeting(getTimeBasedGreeting()),
      60_000,
    );
    return () => clearInterval(interval);
  }, []);

  const name = user?.name || user?.email?.split("@")[0] || "User";
  const firstName = name.split(" ")[0];

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <header className="flex flex-col gap-4 border-b border-primary/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
      <h1 className="font-heading text-2xl font-semibold text-primary capitalize">
        {greeting}, {firstName}
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6e746f]" />
          <input
            className="h-9 w-60 rounded-lg border border-primary/20 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-secondary/30"
            placeholder="Search tasks…"
          />
        </label>
        <ToolbarButton label="Timer">
          <Timer />
        </ToolbarButton>
        <ToolbarButton label="Notifications">
          <Bell />
        </ToolbarButton>
        <ToolbarButton label="Settings">
          <Settings />
        </ToolbarButton>
        <div
          title={user?.email || name}
          className="flex size-9 items-center justify-center rounded-full border-2 border-secondary/30 bg-primary text-xs font-bold text-white uppercase"
        >
          {initials}
        </div>
      </div>
    </header>
  );
};
