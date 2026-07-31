import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

// ── Report aggregation helpers ────────────────────────────────────────────────

import type { Task, TimeLogEntry } from "@/context/TimerContext";

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
  _from: Date,
  _to: Date,
): number {
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

export type StatusDataEntry = {
  status: "todo" | "in_progress" | "done";
  label: string;
  hours: string;
  percent: number;
  value: number;
  fill: string;
};

/** Fixed brand colors for each status bucket — single source of truth. */
const STATUS_FILLS: Record<"todo" | "in_progress" | "done", string> = {
  todo: "#0f3d2e",
  in_progress: "#d4b872",
  done: "#f5f1e8",
};

/**
 * Aggregate timelog durations by the current task status for the given date
 * range and return a statusData-shaped array (one entry per status) plus a
 * formatted grand total.
 *
 * - Timelogs are filtered to those whose startTime falls within [from, to].
 * - Each filtered entry is mapped to the current status of its parent task
 *   (same `tasks.find` lookup pattern used in TimeLogTable).
 * - Entries whose taskId cannot be matched are skipped.
 */
export function getTimeByStatus(
  timelogs: TimeLogEntry[],
  tasks: Task[],
  from: Date,
  to: Date,
): { statusData: StatusDataEntry[]; totalHours: string } {
  const filtered = filterTimelogsInRange(timelogs, from, to);

  const buckets: Record<"todo" | "in_progress" | "done", number> = {
    todo: 0,
    in_progress: 0,
    done: 0,
  };

  for (const log of filtered) {
    const task = tasks.find((t) => t.id === log.taskId);
    if (!task) continue;
    buckets[task.status] += log.duration;
  }

  const totalSeconds = buckets.todo + buckets.in_progress + buckets.done;

  const definitions: {
    status: "todo" | "in_progress" | "done";
    label: string;
  }[] = [
    { status: "todo", label: "To Do" },
    { status: "in_progress", label: "In Progress" },
    { status: "done", label: "Done" },
  ];

  const statusData: StatusDataEntry[] = definitions.map(
    ({ status, label }) => ({
      status,
      label,
      hours: formatReportDuration(buckets[status]),
      percent:
        totalSeconds === 0
          ? 0
          : Math.round((buckets[status] / totalSeconds) * 100),
      value: buckets[status],
      fill: STATUS_FILLS[status],
    }),
  );

  return {
    statusData,
    totalHours: formatReportDuration(totalSeconds),
  };
}
