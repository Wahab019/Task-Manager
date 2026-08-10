"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "@/components/sidebar";
import { TimeTracker } from "@/components/TimeTracker";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";
import { TimerProvider } from "@/context/TimerContext";

function DashboardGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f1e8] text-primary">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Loader2 className="size-35 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <TimerProvider>
      <SidebarProvider>
        <div className="flex h-screen flex-col overflow-hidden print:overflow-visible print:h-auto print:min-h-full">
          <Header />
          <div className="flex flex-1 overflow-hidden print:overflow-visible">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 lg:p-8 print:overflow-visible print:p-0">
              {children}
            </main>
          </div>
          <TimeTracker />
        </div>
      </SidebarProvider>
    </TimerProvider>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DashboardGuard>{children}</DashboardGuard>
    </AuthProvider>
  );
}
