import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Task, TimeLogEntry } from "@/context/TimerContext";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// src/lib/utils.ts (add this alongside your existing helpers)
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function formatDueLabel(deadline: string): string {
  const now = new Date();
  const dueDate = new Date(`${deadline}T00:00:00`);

  if (Number.isNaN(dueDate.getTime())) {
    return "";
  }

  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  });
  const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDueDate = new Date(dueDate);
  startOfDueDate.setHours(0, 0, 0, 0);
  const dayDifference = Math.round(
    (startOfDueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDifference < 0) {
    return "Overdue";
  }

  if (dayDifference === 0) {
    return `Due Today`;
  }

  if (dayDifference === 1) {
    return "Due Tomorrow";
  }

  if (dayDifference > 1 && dayDifference <= 7) {
    return `Due ${dayFormatter.format(dueDate)}`;
  }

  return `Due ${monthDayFormatter.format(dueDate)}`;
}

export function getDueDateColor(deadline: string): "red" | "yellow" | "green" {
  const now = new Date();
  const dueDate = new Date(`${deadline}T00:00:00`);

  if (Number.isNaN(dueDate.getTime())) {
    return "green";
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDueDate = new Date(dueDate);
  startOfDueDate.setHours(0, 0, 0, 0);
  const dayDifference = Math.round(
    (startOfDueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDifference <= 0) {
    return "red";
  }

  if (dayDifference === 1) {
    return "yellow";
  }

  return "green";
}

export function getTasksDueSoon<
  T extends { status: string; deadline: string | null },
>(tasks: T[]): T[] {
  return tasks
    .filter((task) => task.status !== "done" && !!task.deadline?.trim())
    .slice()
    .sort((a, b) => {
      const aTime = new Date(`${a.deadline}T00:00:00`).getTime();
      const bTime = new Date(`${b.deadline}T00:00:00`).getTime();
      return aTime - bTime;
    });
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function endOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

export function getWeeksInMonth(
  month: Date,
): { label: string; from: Date; to: Date }[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const monthEndDay = new Date(year, monthIndex + 1, 0).getDate();

  return [
    {
      label: "Week 1",
      from: new Date(year, monthIndex, 1),
      to: new Date(year, monthIndex, 7),
    },
    {
      label: "Week 2",
      from: new Date(year, monthIndex, 8),
      to: new Date(year, monthIndex, 14),
    },
    {
      label: "Week 3",
      from: new Date(year, monthIndex, 15),
      to: new Date(year, monthIndex, 21),
    },
    {
      label: "Week 4",
      from: new Date(year, monthIndex, 22),
      to: new Date(year, monthIndex, monthEndDay),
    },
  ];
}

export function getHoursByDayInRange(
  timelogs: TimeLogEntry[],
  from: Date,
  to: Date,
): { day: string; hours: number }[] {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const totals = new Map(days.map((day) => [day, 0]));
  const start = startOfDay(from).getTime();
  const end = endOfDay(to).getTime();

  for (const log of timelogs) {
    if (log.startTime < start || log.startTime > end) continue;
    const jsDay = new Date(log.startTime).getDay();
    const day = days[(jsDay + 6) % 7];
    totals.set(day, (totals.get(day) ?? 0) + log.duration / 3600);
  }

  return days.map((day) => ({
    day,
    hours: Math.round((totals.get(day) ?? 0) * 10) / 10,
  }));
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatReportDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// â”€â”€ Report aggregation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Format a total-seconds count as "Xh Ym" (e.g. "38h 15m" or "0m"). */
function formatReportDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/** Timelogs whose startTime (ms epoch) falls within [from, to] (day-inclusive). */
function filterTimelogsInRange(
  timelogs: TimeLogEntry[],
  from: Date,
  to: Date,
): TimeLogEntry[] {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  return timelogs.filter(
    (log) => log.startTime >= start.getTime() && log.startTime <= end.getTime(),
  );
}

/**
 * Sum durations of all timelogs whose startTime falls within [from, to]
 * and return the result formatted as "Xh Ym".
 */
export function getTotalHoursInRange(
  timelogs: TimeLogEntry[],
  from: Date,
  to: Date,
): string {
  const filtered = filterTimelogsInRange(timelogs, from, to);
  const totalSeconds = filtered.reduce((sum, log) => sum + log.duration, 0);
  return formatReportDuration(totalSeconds);
}

/**
 * Count tasks with status "done".
 * Tasks do not currently carry a completion timestamp, so the full list is
 * counted regardless of date range. The from/to params are accepted for
 * forward-compatibility once a completedAt field is added.
 */
export function getTasksCompletedInRange(
  tasks: Task[],
  from: Date,
  to: Date,
): number {
  void from;
  void to;
  return tasks.filter((task) => task.status === "done").length;
}

/**
 * Average duration of timelogs whose startTime falls within [from, to],
 * formatted as "Xh Ym". Returns "0m" when there are no matching entries.
 */
export function getAverageSessionLength(
  timelogs: TimeLogEntry[],
  from: Date,
  to: Date,
): string {
  const filtered = filterTimelogsInRange(timelogs, from, to);
  if (filtered.length === 0) return "0m";
  const totalSeconds = filtered.reduce((sum, log) => sum + log.duration, 0);
  return formatReportDuration(Math.round(totalSeconds / filtered.length));
}

export function getRecentEntriesInMonth(
  timelogs: TimeLogEntry[],
  tasks: Task[],
  month: Date,
  limit: number = 5,
): { id: string; taskName: string; date: string; duration: string }[] {
  const today = new Date();
  const monthStart = startOfMonth(month);
  const monthEnd = isSameMonth(month, today)
    ? new Date(Math.min(endOfMonth(month).getTime(), today.getTime()))
    : endOfMonth(month);
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  return timelogs
    .filter(
      (log) =>
        log.startTime >= monthStart.getTime() &&
        log.startTime <= monthEnd.getTime(),
    )
    .slice()
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, limit)
    .map((log) => {
      const task = tasksById.get(log.taskId);
      return {
        id: log.id,
        taskName: task?.title ?? "Deleted task",
        date: formatReportDate(new Date(log.startTime)),
        duration: formatReportDuration(log.duration),
      };
    });
}
