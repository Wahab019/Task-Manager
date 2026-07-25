"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { TimeLog, useTimer } from "@/context/TimerContext";

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

const weekFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const rowColors = ["bg-primary", "bg-[#886719]", "bg-[#557b70]"];

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function startOfWeek(date: Date) {
  const nextDate = startOfDay(date);
  const day = nextDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + mondayOffset);
  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatWeekRange(monday: Date) {
  const sunday = addDays(monday, 6);
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  const yearLabel = sameYear ? sunday.getFullYear() : "";
  return `${weekFormatter.format(monday)} - ${weekFormatter.format(sunday)} ${yearLabel}`.trim();
}

export function DateRow({
  label,
  total,
  current,
}: {
  label: string;
  total: string;
  current?: boolean;
}) {
  return (
    <tr className="border-b border-primary/10 bg-[#f5f3f1]">
      <td className="px-5 py-3 text-xs font-semibold text-primary" colSpan={2}>
        {label}{" "}
        {current && (
          <span className="ml-2 bg-[#ffdf9b] px-1.5 py-1 text-[8px] font-bold text-[#795f1f] uppercase">
            Current day
          </span>
        )}
      </td>
      <td className="px-4 py-4 text-xs font-bold text-primary">
        Total: {total}
      </td>
    </tr>
  );
}

export function LogRow({
  title,
  description,
  hours,
  duration,
  color,
}: {
  title: string;
  description: string;
  hours: string;
  duration: string;
  color: string;
}) {
  return (
    <tr className="border-b border-primary/5">
      <td className="px-5 py-4">
        <div className="flex gap-3">
          <span className={`mt-1 h-5 w-1 rounded-full ${color}`} />
          <span>
            <strong className="block text-xs tracking-wide text-primary">
              {title}
            </strong>
            <span className="block text-[10px] text-primary">
              {description}
            </span>
          </span>
        </div>
      </td>
      <td className="px-4 py-4 text-xs text-primary">{hours}</td>
      <td className="px-4 py-4 text-xs font-bold text-primary">{duration}</td>
    </tr>
  );
}

export const LogTable = () => {
  const { tasks, timeLogs } = useTimer();
  const [selectedMonday, setSelectedMonday] = useState(() =>
    startOfWeek(new Date()),
  );

  const todayKey = startOfDay(new Date()).toISOString();

  const days = useMemo(() => {
    const weekStart = startOfDay(selectedMonday);
    const weekEnd = addDays(weekStart, 7);
    const tasksById = new Map(tasks.map((task) => [task.id, task]));

    const logsByDay = timeLogs
      .filter((log) => {
        const start = new Date(log.startTime);
        return start >= weekStart && start < weekEnd;
      })
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      )
      .reduce<Map<string, TimeLog[]>>((groups, log) => {
        const key = startOfDay(new Date(log.startTime)).toISOString();
        const logs = groups.get(key) ?? [];
        logs.push(log);
        groups.set(key, logs);
        return groups;
      }, new Map());

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, 6 - index);
      const key = date.toISOString();
      const logs = logsByDay.get(key) ?? [];
      const total = logs.reduce((sum, log) => sum + log.duration, 0);

      return {
        date,
        key,
        logs: logs.map((log, logIndex) => {
          const task = tasksById.get(log.taskId);
          const start = new Date(log.startTime);
          const end = new Date(log.endTime);

          return {
            ...log,
            title: task?.title ?? "Deleted task",
            description:
              task?.description ?? "This task is no longer in your task list.",
            hours: `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`,
            duration: formatDuration(log.duration),
            color: rowColors[logIndex % rowColors.length],
          };
        }),
        total: formatDuration(total),
      };
    });
  }, [selectedMonday, tasks, timeLogs]);

  return (
    <>
      <section className="mt-10 overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-primary/10 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex w-fit items-center rounded-xl bg-[#f7f6f4] px-3 py-1">
            <button
              aria-label="Previous week"
              className="p-2 text-primary"
              type="button"
              onClick={() =>
                setSelectedMonday((current) => addDays(current, -7))
              }
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-42 text-center text-xs font-bold text-primary">
              {formatWeekRange(selectedMonday)}
            </span>
            <button
              aria-label="Next week"
              className="p-2 text-primary"
              type="button"
              onClick={() =>
                setSelectedMonday((current) => addDays(current, 7))
              }
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          {/* <div className="flex gap-2">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
              <input
                className="h-9 w-55 rounded-xl border border-primary/10 bg-[#faf9f7] pl-9 pr-3 text-xs outline-none focus:border-primary"
                placeholder="Search tasks..."
              />
            </label>
            <button
              aria-label="Filter logs"
              className="flex size-9 items-center justify-center rounded-xl border border-primary/10"
            >
              <SlidersHorizontal className="size-4 text-primary" />
            </button>
          </div> */}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left">
            <thead className="border-b border-primary/10 bg-[#faf9f7] text-[10px] font-bold tracking-widest text-primary uppercase">
              <tr>
                <th className="px-5 py-4">Date / Task name</th>
                <th className="px-4 py-4">Start - End</th>
                <th className="px-4 py-4">Duration</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <Fragment key={day.key}>
                  <DateRow
                    label={dayFormatter.format(day.date)}
                    total={day.total}
                    current={day.key === todayKey}
                  />
                  {day.logs.map((log) => (
                    <LogRow
                      key={log.id}
                      title={log.title}
                      description={log.description}
                      hours={log.hours}
                      duration={log.duration}
                      color={log.color}
                    />
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
