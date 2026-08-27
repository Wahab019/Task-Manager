import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Task, TimeLogEntry } from "@/context/TimerContext";

/** Combines conditional class names and resolves conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a greeting based on the current local hour.
 * Night covers hours before 05:00 and from 21:00 onward.
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

/**
 * Converts a calendar deadline into a compact relative due-date label.
 * Invalid dates return an empty string; dates beyond the next seven days use
 * a short month/day label instead of a weekday.
 */
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

/**
 * Formats a timestamp as a short relative time string.
 * Future timestamps are treated as occurring now, so the result never says
 * that an event happened in the future.
 */
export function formatRelativeTime(timestamp: string | number | Date): string {
  const time =
    typeof timestamp === "number"
      ? timestamp
      : timestamp instanceof Date
        ? timestamp.getTime()
        : new Date(timestamp).getTime();

  if (Number.isNaN(time)) {
    return "";
  }

  const now = Date.now();
  const diffSeconds = Math.max(0, Math.round((now - time) / 1000));
  const minutes = Math.floor(diffSeconds / 60);
  const hours = Math.floor(diffSeconds / 3600);
  const days = Math.floor(diffSeconds / 86400);

  if (diffSeconds < 60) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (days === 1) {
    return "yesterday";
  }

  return `${days} days ago`;
}

/** Formats elapsed seconds as an `HH:MM:SS` clock-style duration label. */
export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/** Maps a deadline to the due-date urgency color used by the UI. */
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

/**
 * Returns unfinished tasks with non-empty deadlines sorted nearest first.
 * The input array is copied before sorting, so callers' task order is preserved.
 */
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

/** Returns a copy of a date normalized to the first millisecond of its day. */
function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/** Returns a copy of a date normalized to the final millisecond of its day. */
function endOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

/** Builds four fixed seven-day report ranges covering a selected month. */
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

/**
 * Aggregates time-log durations into rounded hour totals for Monday-Sunday.
 * Logs are included when their start timestamp falls within the inclusive
 * local-day range from `from` through `to`.
 */
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

/** Returns the first local calendar day of the supplied month. */
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Returns the last local calendar day of the supplied month. */
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** Returns whether two dates share the same local month and year. */
function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Formats a report date as a localized short month/day/year label. */
function formatReportDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Formats total seconds as `Xh Ym`, omitting hours when they are zero. */
function formatReportDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/** Returns time logs whose start timestamps fall within the inclusive date range. */
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

/** Sums matching time-log durations and formats the result as `Xh Ym`. */
export function getTotalHoursInRange(
  timelogs: TimeLogEntry[],
  from: Date,
  to: Date,
): string {
  const filtered = filterTimelogsInRange(timelogs, from, to);
  const totalSeconds = filtered.reduce((sum, log) => sum + log.duration, 0);
  return formatReportDuration(totalSeconds);
}

/** Counts completed tasks whose valid update timestamp falls in the date range. */
export function getTasksCompletedInRange(
  tasks: Task[],
  from: Date,
  to: Date,
): number {
  const start = startOfDay(from).getTime();
  const end = endOfDay(to).getTime();

  return tasks.filter((task) => {
    if (task.status !== "done" || !task.$updatedAt) {
      return false;
    }

    const completedAt = new Date(task.$updatedAt).getTime();
    if (Number.isNaN(completedAt)) {
      return false;
    }

    return completedAt >= start && completedAt <= end;
  }).length;
}

/**
 * Averages matching time-log durations and formats the result as `Xh Ym`.
 * Returns `0m` when the date range contains no entries.
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

/**
 * Builds recent report rows by joining monthly time logs to task metadata.
 * Results are newest first and limited to the requested number of entries.
 */
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

/**
 * Returns recently completed tasks for the selected report month.
 * Results are newest first and limited to the requested number of tasks.
 */
export function getRecentCompletedTasksInMonth(
  tasks: Task[],
  month: Date,
  limit: number = 5,
): { id: string; taskName: string; date: string; duration: string }[] {
  const today = new Date();
  const monthStart = startOfMonth(month);
  const monthEnd = isSameMonth(month, today)
    ? new Date(Math.min(endOfMonth(month).getTime(), today.getTime()))
    : endOfMonth(month);

  return tasks
    .filter((task) => {
      if (task.status !== "done" || !task.$updatedAt) {
        return false;
      }

      const completedAt = new Date(task.$updatedAt).getTime();
      if (Number.isNaN(completedAt)) {
        return false;
      }

      return (
        completedAt >= monthStart.getTime() && completedAt <= monthEnd.getTime()
      );
    })
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.$updatedAt ?? 0).getTime();
      const bTime = new Date(b.$updatedAt ?? 0).getTime();
      return bTime - aTime;
    })
    .slice(0, limit)
    .map((task) => ({
      id: task.id,
      taskName: task.title,
      date: formatReportDate(new Date(task.$updatedAt ?? Date.now())),
      duration: formatReportDuration(task.elapsedSeconds),
    }));
}
