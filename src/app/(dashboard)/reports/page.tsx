"use client";

import { useState, useMemo } from "react";
import { CalendarDays, CheckCircle2, Clock3, Download } from "lucide-react";

import {
  ReportBarChart,
  ReportMetric,
  ReportTable,
} from "@/components/Reports";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/context/TimerContext";
import {
  getAverageSessionLength,
  getTasksCompletedInRange,
  getTotalHoursInRange,
} from "@/lib/utils";

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatMonthLabel(month: Date, currentYear: number) {
  const monthName = month.toLocaleDateString("en-US", { month: "long" });
  if (month.getFullYear() === currentYear) {
    return monthName;
  }
  return `${monthName} ${month.getFullYear()}`;
}

const metricDefs = [
  { icon: Clock3, label: "Total Hours" },
  { icon: CheckCircle2, label: "Tasks Completed" },
  { icon: Clock3, label: "Avg Session Length" },
] as const;

export default function ReportsPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const { tasks, timelogs, isLoading, error, reloadData } = useTimer();
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(today));

  const monthOptions = Array.from({ length: 25 }, (_, index) => {
    const month = new Date(today.getFullYear(), today.getMonth() - index, 1);
    return {
      value: `${month.getFullYear()}-${month.getMonth() + 1}`,
      label: formatMonthLabel(month, currentYear),
    };
  });

  const selectedMonthValue = `${selectedMonth.getFullYear()}-${selectedMonth.getMonth() + 1}`;
  const range = {
    from: startOfMonth(selectedMonth),
    to: isSameMonth(selectedMonth, today)
      ? new Date(Math.min(endOfMonth(selectedMonth).getTime(), today.getTime()))
      : endOfMonth(selectedMonth),
  };

  const reportDateLabel = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const metricValues = useMemo(
    () =>
      [
        getTotalHoursInRange(timelogs, range.from, range.to),
        String(getTasksCompletedInRange(tasks, range.from, range.to)),
        getAverageSessionLength(timelogs, range.from, range.to),
      ] as const,
    [range.from, range.to, tasks, timelogs],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm"
            >
              <div className="h-5 w-24 rounded-md bg-[#eae7e7]" />
              <div className="mt-5 h-10 rounded-md bg-[#eae7e7]" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-primary/10 bg-white p-6 shadow-sm">
          <div className="h-8 w-40 rounded-md bg-[#eae7e7]" />
          <div className="mt-5 h-72 rounded-md bg-[#eae7e7]" />
        </div>
        <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="mt-4 h-4 rounded-md bg-[#eae7e7] first:mt-0"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>Something went wrong loading reports.</p>
            <Button variant="outline" size="sm" onClick={reloadData}>
              Try again
            </Button>
          </div>
        </div>
      )}
      <header className="print:hidden flex flex-col gap-4 pb-7 md:items-end md:justify-between md:flex-row">
        <div>
          <h1 className="font-heading text-4xl font-semibold text-primary">
            Reports
          </h1>
          <p className="mt-1 text-sm text-[#47857a]">
            Your personal performance summary.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 print:hidden md:items-center md:flex-row md:gap-2">
          <Select
            value={selectedMonthValue}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              const [year, month] = value.split("-").map(Number);
              setSelectedMonth(new Date(year, month - 1, 1));
            }}
          >
            <SelectTrigger
              className="flex h-9 items-center gap-2 rounded-lg border border-primary/10 bg-white px-3 text-xs font-semibold text-primary shadow-sm"
              size="default"
            >
              <CalendarDays className="size-3.5 text-[#47857a]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectLabel>Months</SelectLabel>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            variant="heritage-outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 rounded-lg border-primary/10 bg-white px-3 text-xs font-semibold text-primary shadow-lg"
          >
            <Download /> Print Report
          </Button>
        </div>
      </header>

      <div className="hidden print:block rounded-2xl print:border-0 border border-primary/10 bg-white p-5 shadow-sm print:shadow-none">
        <h2 className="font-heading text-2xl font-semibold text-primary">
          Report for {formatMonthLabel(selectedMonth, currentYear)}
        </h2>
        <p className="mt-1 text-sm text-[#47857a]">
          Generated on {reportDateLabel}
        </p>
      </div>

      <section className="grid gap-5 md:grid-cols-3">
        {metricDefs.map((def, index) => (
          <ReportMetric
            key={def.label}
            icon={def.icon}
            label={def.label}
            value={metricValues[index]}
            selectedMonth={selectedMonth}
          />
        ))}
      </section>

      <section className="print:hidden">
        <ReportBarChart selectedMonth={selectedMonth} />
      </section>

      <ReportTable selectedMonth={selectedMonth} />
    </div>
  );
}
