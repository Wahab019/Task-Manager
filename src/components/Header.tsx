"use client";

import { PanelLeft, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

export function ToolbarButton({
  children,
  label,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex size-9 items-center justify-center rounded-full text-primary transition hover:bg-[#eae7e7] [&_svg]:size-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
    >
      {children}
    </button>
  );
}

export const Header = () => {
  const { user } = useAuth();
  const { toggle } = useSidebar();

  const name = user?.name || user?.email?.split("@")[0] || "User";

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <header className="print:hidden flex flex-row gap-4 border-b border-primary/10 py-4 px-4 lg:px-8 lg:flex-row lg:items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Sidebar toggle button */}
        <ToolbarButton label="Toggle sidebar" onClick={toggle}>
          <PanelLeft />
        </ToolbarButton>

        <h1 className="font-heading text-2xl font-semibold text-primary capitalize">
          Task Manager
        </h1>
      </div>

      {/* <label className="relative hidden lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6e746f]" />
        <input
          className="h-9 w-100 rounded-lg border border-primary/20 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-secondary/30"
          placeholder="Search tasks…"
        />
      </label> */}
      <div className="flex items-center print:hidden">
        <div
          title={user?.email || name}
          className="flex size-9 items-center justify-center rounded-full border-2 border-secondary/30 bg-primary text-xs font-bold text-white uppercase"
        >
          {initials}
        </div>
        <div className="hidden md:flex flex-col px-3 py-1">
          <div className="text-sm font-bold">{user?.name}</div>
          {user?.email && (
            <div
              className=" text-[11px] font-medium text-[#707772] truncate"
              title={user.email}
            >
              {user.email}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
