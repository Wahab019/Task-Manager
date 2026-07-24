import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TodaysTotal, WeeklyProgress, LogTable } from "@/components/TimeLogs";

export default function TimeLogsPage() {
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
        <div className="flex gap-3">
          <Button variant="heritage-outline" size="lg">
            <Download /> Export Report
          </Button>
        </div>
      </header>
      <section className="mt-10 grid gap-5 lg:grid-cols-12">
        <TodaysTotal />
        <WeeklyProgress />
      </section>
      <LogTable />
    </div>
  );
}
