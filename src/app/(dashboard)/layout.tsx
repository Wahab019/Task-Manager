import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TimeTracker } from "@/components/TimeTracker";
import { Header } from "@/components/Header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-screen bg-[#f5f1e8] text-foreground">
        <Sidebar />
        <div className="min-w-0 flex-1 p-8 space-y-6">
          <Header />
          <main>{children}</main>
        </div>

        <TimeTracker />
      </div>
    </>
  );
}
