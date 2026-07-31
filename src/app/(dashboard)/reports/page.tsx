"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, ChevronDown } from "lucide-react";
import type { DateRange as DayPickerDateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ReportMetric,
  ReportBarChart,
  ReportTable,
} from "@/components/Reports";
import type { DateRange } from "@/components/Reports/report-metric";
import { useTimer } from "@/context/TimerContext";
import {
  getTotalHoursInRange,
  getTasksCompletedInRange,
  getAverageSessionLength,
} from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDateRangeLabel(from: Date, to: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "2-digit" };
  const fmt = (d: Date) => d.toLocaleDateString("en-US", opts).replace(",", "");
  return `${fmt(from)} - ${fmt(to)}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// ── metric icon/label definitions (values computed from real data) ────────────

const metricDefs = [
  { icon: Clock3, label: "Total Hours" },
  { icon: CheckCircle2, label: "Tasks Completed" },
  { icon: Clock3, label: "Avg Session Length" },
] as const;

// ── page ──────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const today = new Date();
  const { tasks, timelogs } = useTimer();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(today),
    to: today,
  });

  // react-day-picker's DateRange allows undefined from/to; we keep a valid
  // range in local state and only commit when both ends are selected.
  const [pickerRange, setPickerRange] = useState<
    DayPickerDateRange | undefined
  >({
    from: dateRange.from,
    to: dateRange.to,
  });
  const [open, setOpen] = useState(false);

  // ── computed metric values ────────────────────────────────────────────────
  const metricValues = useMemo(
    () =>
      [
        getTotalHoursInRange(timelogs, dateRange.from, dateRange.to),
        String(getTasksCompletedInRange(tasks, dateRange.from, dateRange.to)),
        getAverageSessionLength(timelogs, dateRange.from, dateRange.to),
      ] as const,
    [timelogs, tasks, dateRange],
  );

  function handleSelect(range: DayPickerDateRange | undefined) {
    setPickerRange(range);
    if (range?.from && range?.to) {
      setDateRange({ from: range.from, to: range.to });
      setOpen(false);
    }
  }

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

        {/* ── Date Range Picker ─────────────────────────────────────── */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <button className="flex h-9 items-center gap-2 self-start rounded-lg border border-primary/10 bg-white px-3 text-xs font-semibold text-primary shadow-sm md:self-auto" />
            }
          >
            <CalendarDays className="size-3.5 text-[#47857a]" />
            {formatDateRangeLabel(dateRange.from, dateRange.to)}
            <ChevronDown className="w-4 h-4" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={pickerRange}
              onSelect={handleSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        {metricDefs.map((def, index) => (
          <ReportMetric
            key={def.label}
            icon={def.icon}
            label={def.label}
            value={metricValues[index]}
            dateRange={dateRange}
          />
        ))}
      </section>

      <section>
        {/* <ReportPieChart dateRange={dateRange} /> */}
        <ReportBarChart dateRange={dateRange} />
      </section>

      <ReportTable dateRange={dateRange} />
    </div>
  );
}
