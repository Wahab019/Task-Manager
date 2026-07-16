"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem("task-manager-auth");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              TM
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Task Manager</p>
              <p className="text-xs text-slate-500">Your daily workboard</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Sign out
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
