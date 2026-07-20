import { CalendarDays, CheckCircle2, Clock3, ChevronDown } from "lucide-react";

import {
  ReportPieChart,
  ReportMetric,
  ReportBarChart,
  ReportTable,
} from "@/components/Reports";

const reportMetrics = [
  {
    icon: Clock3,
    label: "Total Hours",
    value: "38h 15m",
  },
  {
    icon: CheckCircle2,
    label: "Tasks Completed",
    value: "12",
  },
  {
    icon: Clock3,
    label: "Avg Session Length",
    value: "1h 45m",
  },
];

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 md:flex-row pb-7 md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-semibold text-primary">
            Reports
          </h1>
          <p className="mt-1 text-sm text-[#47857a]">
            Your personal performance summary.
          </p>
        </div>
        <button className="flex h-9 items-center gap-2 self-start rounded-lg border border-primary/10 bg-white px-3 text-xs font-semibold text-primary shadow-sm md:self-auto">
          <CalendarDays className="size-3.5 text-[#47857a]" /> Oct 01 - Oct 31
          <ChevronDown className="w-4 h-4" />
        </button>
      </header>
      <section className="grid gap-5 md:grid-cols-3">
        {reportMetrics.map((metric, index) => (
          <ReportMetric
            key={index}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <ReportPieChart />
        <ReportBarChart />
      </section>
      <ReportTable />
    </div>
  );
}
