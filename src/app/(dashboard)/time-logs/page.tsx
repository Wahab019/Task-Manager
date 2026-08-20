"use client";

import { TodaysTotal, WeeklyProgress, LogTable } from "@/components/TimeLogs";
import { useTimer } from "@/context/TimerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TimeLogsPage() {
  const { error, reloadData, isLoading } = useTimer();
  if (isLoading) {
    return (
      <div className="relative pb-20 mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-5 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="h-8 w-72 rounded-md bg-[#eae7e7]" />
            <div className="mt-3 h-4 w-96 rounded-md bg-[#eae7e7]" />
          </div>
        </header>
        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-4 rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
            <div className="h-6 w-28 rounded-md bg-[#eae7e7]" />
            <div className="mt-5 h-24 rounded-md bg-[#eae7e7]" />
          </div>
          <div className="lg:col-span-8 rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
            <div className="h-6 w-32 rounded-md bg-[#eae7e7]" />
            <div className="mt-5 h-24 rounded-md bg-[#eae7e7]" />
          </div>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
          <div className="h-6 w-40 rounded-md bg-[#eae7e7]" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-10 rounded-md bg-[#eae7e7]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-20 mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-5 pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mt-2 font-heading text-4xl font-semibold text-primary">
            Daily &amp; Weekly Logs
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-primary">
            Monitor productivity across projects with high-precision time
            tracking and editorial-grade reporting.
          </p>
        </div>
      </header>
      {error && (
        <Card className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>Something went wrong loading time logs.</p>
            <Button variant="outline" size="sm" onClick={reloadData}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}
      <section className="mt-10 grid gap-5 lg:grid-cols-12">
        <TodaysTotal />
        <WeeklyProgress />
      </section>
      <LogTable />
    </div>
  );
}
