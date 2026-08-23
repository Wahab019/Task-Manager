"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { TimeLogEntry, useTimer } from "@/context/TimerContext";

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

/** Returns a copy of a date normalized to the start of its local day. */
function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

/** Returns a copy of a date normalized to Monday at the start of its week. */
function startOfWeek(date: Date) {
  const nextDate = startOfDay(date);
  const day = nextDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + mondayOffset);
  return nextDate;
}

/** Returns a copy of a date shifted by the requested number of days. */
function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

/** Formats elapsed seconds as a compact `HH:MM` duration label. */
function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Formats a Monday date and its following Sunday as the table week range. */
function formatWeekRange(monday: Date) {
  const sunday = addDays(monday, 6);
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  const yearLabel = sameYear ? sunday.getFullYear() : "";
  return `${weekFormatter.format(monday)} - ${weekFormatter.format(sunday)} ${yearLabel}`.trim();
}

/** Returns a log's end time, using the current time for open entries. */
function getEntryEndTime(entry: TimeLogEntry) {
  return entry.endTime ?? Date.now();
}

/** Builds ISO date keys for the selected week, excluding future days. */
function getWeekDayKeys(weekStart: Date, today: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, 6 - index);
    if (date > today) {
      return null;
    }
    return date.toISOString();
  }).filter((key): key is string => key !== null);
}

/** Properties displayed by a collapsible day summary row. */
type DateRowProps = {
  label: string;
  total: string;
  current?: boolean;
  collapsed: boolean;
  onToggle: () => void;
};

/** Renders a collapsible day summary row in the weekly log table. */
export function DateRow({
  label,
  total,
  current,
  collapsed,
  onToggle,
}: DateRowProps) {
  return (
    <tr className="border-b border-primary/10 bg-[#f5f3f1]">
      <td className="px-5 py-3 text-xs font-semibold text-primary" colSpan={2}>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 text-left"
        >
          <ChevronDown
            className={`size-4 shrink-0 text-primary transition-transform duration-200 ${
              collapsed ? "-rotate-90" : "rotate-0"
            }`}
          />
          <span>
            {label}{" "}
            {current && (
              <span className="ml-2 bg-[#ffdf9b] px-1.5 py-1 text-[8px] font-bold text-[#795f1f] uppercase">
                Current day
              </span>
            )}
          </span>
        </button>
      </td>
      <td className="px-4 py-3 text-xs font-bold text-primary">
        Total: {total}
      </td>
    </tr>
  );
}

/**
 * Renders the weekly time-log table grouped by day and task.
 *
 * It manages week navigation, collapsed days, expanded task sessions, loading
 * feedback, and retry behavior through TimerContext.
 */
export const LogTable = () => {
  const { tasks, timelogs, isLoading, error, reloadData } = useTimer();
  const today = startOfDay(new Date());
  const todayKey = today.toISOString();
  const currentWeekMonday = startOfWeek(new Date());
  const [selectedMonday, setSelectedMonday] = useState(() =>
    startOfWeek(new Date()),
  );
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(
    () => new Set(getWeekDayKeys(startOfWeek(new Date()), today)),
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const days = useMemo(() => {
    const weekStart = startOfDay(selectedMonday);
    const weekEnd = addDays(weekStart, 7);
    const tasksById = new Map(tasks.map((task) => [task.id, task]));

    const logsByDay = timelogs
      .filter((log) => {
        const start = new Date(log.startTime);
        return start >= weekStart && start < weekEnd;
      })
      .reduce<Map<string, TimeLogEntry[]>>((groups, log) => {
        const key = startOfDay(new Date(log.startTime)).toISOString();
        const logs = groups.get(key) ?? [];
        logs.push(log);
        groups.set(key, logs);
        return groups;
      }, new Map());

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, 6 - index);
      if (date > today) {
        return null;
      }
      const key = date.toISOString();
      const logs = (logsByDay.get(key) ?? [])
        .slice()
        .sort((a, b) => a.startTime - b.startTime);

      const groupedByTask = logs.reduce<
        Map<string, { taskId: string; logs: TimeLogEntry[] }>
      >((groups, log) => {
        const group = groups.get(log.taskId) ?? {
          taskId: log.taskId,
          logs: [],
        };
        group.logs.push(log);
        groups.set(log.taskId, group);
        return groups;
      }, new Map());

      const taskGroups = Array.from(groupedByTask.values()).map((group) => {
        const task = tasksById.get(group.taskId);
        const total = group.logs.reduce((sum, log) => sum + log.duration, 0);
        return {
          taskId: group.taskId,
          title: task?.title ?? "Deleted task",
          description:
            task?.description ?? "This task is no longer in your task list.",
          total: formatDuration(total),
          totalSeconds: total,
          segments: group.logs.map((log) => ({
            id: log.id,
            start: new Date(log.startTime),
            end: new Date(getEntryEndTime(log)),
            duration: formatDuration(log.duration),
          })),
        };
      });

      return {
        date,
        key,
        taskGroups,
        total: formatDuration(
          taskGroups.reduce((sum, group) => sum + group.totalSeconds, 0),
        ),
      };
    }).filter((day): day is NonNullable<typeof day> => day !== null);
  }, [selectedMonday, tasks, timelogs, today]);

  /** Moves the table by one week and resets collapsed-day state. */
  function navigateWeek(offset: number) {
    const nextMonday = addDays(selectedMonday, offset);
    setSelectedMonday(nextMonday);
    setCollapsedDays(new Set(getWeekDayKeys(nextMonday, today)));
  }

  /** Toggles whether a day's task rows are visible. */
  function toggleDay(key: string) {
    setCollapsedDays((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  /** Toggles whether a multi-segment task group shows its sessions. */
  function toggleGroupExpanded(groupKey: string) {
    setExpandedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  }

  if (isLoading) {
    return (
      <section className="mt-10 overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="p-5 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="overflow-x-auto">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <span>Something went wrong loading time logs.</span>
            <button
              type="button"
              className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-800 transition hover:bg-red-50"
              onClick={reloadData}
            >
              Try again
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 border-b border-primary/10 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex w-fit items-center rounded-xl bg-[#f7f6f4] px-3 py-1">
          <button
            aria-label="Previous week"
            className="p-2 text-primary"
            type="button"
            onClick={() => navigateWeek(-7)}
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-42 text-center text-xs font-bold text-primary">
            {formatWeekRange(selectedMonday)}
          </span>
          <button
            aria-label="Next week"
            className="p-2 text-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            type="button"
            disabled={selectedMonday >= currentWeekMonday}
            onClick={() => navigateWeek(7)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
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
            {days.map((day) => {
              const isDayCollapsed = collapsedDays.has(day.key);
              return (
                <Fragment key={day.key}>
                  <DateRow
                    label={dayFormatter.format(day.date)}
                    total={day.total}
                    current={day.key === todayKey}
                    collapsed={isDayCollapsed}
                    onToggle={() => toggleDay(day.key)}
                  />
                  {!isDayCollapsed && (
                    <>
                      {day.taskGroups.length > 0 ? (
                        day.taskGroups.map((group) => (
                          <Fragment key={`${day.key}-${group.taskId}`}>
                            {group.segments.length === 1 ? (
                              <tr className="border-b border-primary/5 bg-white">
                                <td className="px-5 py-4">
                                  <strong className="block text-xs tracking-wide text-primary">
                                    {group.title}
                                  </strong>
                                  <span className="block text-[10px] text-primary">
                                    {group.description}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-xs text-primary">
                                  {timeFormatter.format(
                                    group.segments[0].start,
                                  )}{" "}
                                  -{" "}
                                  {timeFormatter.format(group.segments[0].end)}
                                </td>
                                <td className="px-4 py-4 text-xs font-bold text-primary">
                                  {group.segments[0].duration}
                                </td>
                              </tr>
                            ) : (
                              <>
                                <tr className="border-b border-primary/5 bg-white">
                                  <td className="px-5 py-4">
                                    <button
                                      aria-expanded={
                                        expandedGroups[
                                          `${day.key}-${group.taskId}`
                                        ]
                                      }
                                      className="flex w-full items-start gap-2 text-left"
                                      type="button"
                                      onClick={() =>
                                        toggleGroupExpanded(
                                          `${day.key}-${group.taskId}`,
                                        )
                                      }
                                    >
                                      <ChevronRight
                                        className={`mt-0.5 size-4 shrink-0 text-primary transition-transform duration-200 ${
                                          expandedGroups[
                                            `${day.key}-${group.taskId}`
                                          ]
                                            ? "rotate-90"
                                            : "rotate-0"
                                        }`}
                                      />
                                      <span>
                                        <strong className="block text-xs tracking-wide text-primary">
                                          {group.title}
                                        </strong>
                                        <span className="block text-[10px] text-primary">
                                          {group.description}
                                        </span>
                                      </span>
                                    </button>
                                  </td>
                                  <td className="px-4 py-4 text-xs text-primary">
                                    Task total
                                  </td>
                                  <td className="px-4 py-4 text-xs font-bold text-primary">
                                    {group.total}
                                  </td>
                                </tr>
                                {expandedGroups[`${day.key}-${group.taskId}`] &&
                                  group.segments.map((segment) => (
                                    <tr
                                      key={segment.id}
                                      className="border-b border-primary/5 bg-[#faf9f7]"
                                    >
                                      <td className="px-5 py-4 pl-12 text-xs text-primary">
                                        Segment
                                      </td>
                                      <td className="px-4 py-4 text-xs text-primary">
                                        {timeFormatter.format(segment.start)} -{" "}
                                        {timeFormatter.format(segment.end)}
                                      </td>
                                      <td className="px-4 py-4 text-xs font-bold text-primary">
                                        {segment.duration}
                                      </td>
                                    </tr>
                                  ))}
                              </>
                            )}
                          </Fragment>
                        ))
                      ) : (
                        <tr className="border-b border-primary/5">
                          <td
                            className="px-5 py-4 text-sm text-[#6e746f]"
                            colSpan={3}
                          >
                            No time logs for this day.
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
