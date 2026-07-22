"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
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
          {/* Authenticating workspace... */}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <TimerProvider>
      <div className="flex min-h-screen bg-[#f5f1e8] text-foreground">
        <Sidebar />
        <div className="min-w-0 flex-1 p-8 space-y-6">
          <Header />
          <main>{children}</main>
        </div>

        <TimeTracker />
      </div>
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
