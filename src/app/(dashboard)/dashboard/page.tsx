"use client";

import {
  DashboardProgress,
  TotalHours,
  RecentActivity,
  DailyTimeline,
  TasksDue,
} from "@/components/Dashboard";
import { useTimer } from "@/context/TimerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { tasks, error, reloadData, isLoading } = useTimer();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-5 h-28" />
            <div className="mt-5 flex gap-3">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
          <div className="lg:col-span-4 rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="mt-5 h-20" />
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7 rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
            <Skeleton className="h-6 w-40" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12" />
              ))}
            </div>
          </div>
          <div className="space-y-6 xl:col-span-5">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm"
              >
                <Skeleton className="h-6 w-32" />
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {error && (
        <Card className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>Something went wrong loading your dashboard data.</p>
            <Button variant="outline" size="sm" onClick={reloadData}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}
      <section className="grid gap-6 lg:grid-cols-12">
        <DashboardProgress />
        <TotalHours />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <DailyTimeline />

        <div className="space-y-6 xl:col-span-5">
          <RecentActivity />
          <TasksDue tasks={tasks} />
        </div>
      </section>
    </div>
  );
}
