"use client";

import { useState, useMemo } from "react";
import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

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
  const { tasks, timelogs } = useTimer();
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(today));

  const monthOptions = Array.from({ length: 25 }, (_, index) => {
    const month = new Date(today.getFullYear(), today.getMonth() - index, 1);
    return {
      value: `${month.getFullYear()}-${month.getMonth()}`,
      label: formatMonthLabel(month, currentYear),
    };
  });

  const selectedMonthValue = `${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`;
  const range = {
    from: startOfMonth(selectedMonth),
    to: isSameMonth(selectedMonth, today)
      ? new Date(Math.min(endOfMonth(selectedMonth).getTime(), today.getTime()))
      : endOfMonth(selectedMonth),
  };

  const metricValues = useMemo(
    () =>
      [
        getTotalHoursInRange(timelogs, range.from, range.to),
        String(getTasksCompletedInRange(tasks, range.from, range.to)),
        getAverageSessionLength(timelogs, range.from, range.to),
      ] as const,
    [range.from, range.to, tasks, timelogs],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 pb-7 md:items-end md:justify-between md:flex-row">
        <div>
          <h1 className="font-heading text-4xl font-semibold text-primary">
            Reports
          </h1>
          <p className="mt-1 text-sm text-[#47857a]">
            Your personal performance summary.
          </p>
        </div>

        <Select
          value={selectedMonthValue}
          onValueChange={(value) => {
            if (!value) {
              return;
            }

            const [year, month] = value.split("-").map(Number);
            setSelectedMonth(new Date(year, month, 1));
          }}
        >
          <SelectTrigger
            className="flex h-9 items-center gap-2 self-start rounded-lg border border-primary/10 bg-white px-3 text-xs font-semibold text-primary shadow-sm md:self-auto"
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
      </header>

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

      <section>
        <ReportBarChart selectedMonth={selectedMonth} />
      </section>

      <ReportTable selectedMonth={selectedMonth} />
    </div>
  );
}
