"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

function getEntryEndTime(entry: TimeLogEntry) {
  return entry.endTime ?? Date.now();
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
      <td className="px-4 py-3 text-xs font-bold text-primary">
        Total: {total}
      </td>
    </tr>
  );
}

export const LogTable = () => {
  const { tasks, timelogs } = useTimer();
  const [selectedMonday, setSelectedMonday] = useState(() =>
    startOfWeek(new Date()),
  );

  const todayKey = startOfDay(new Date()).toISOString();

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
    });
  }, [selectedMonday, tasks, timelogs]);

  return (
    <section className="mt-10 overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-primary/10 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex w-fit items-center rounded-xl bg-[#f7f6f4] px-3 py-1">
          <button
            aria-label="Previous week"
            className="p-2 text-primary"
            type="button"
            onClick={() => setSelectedMonday((current) => addDays(current, -7))}
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
            onClick={() => setSelectedMonday((current) => addDays(current, 7))}
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
            {days.map((day) => (
              <Fragment key={day.key}>
                <DateRow
                  label={dayFormatter.format(day.date)}
                  total={day.total}
                  current={day.key === todayKey}
                />
                {day.taskGroups.length > 0 ? (
                  day.taskGroups.map((group) => (
                    <Fragment key={`${day.key}-${group.taskId}`}>
                      <tr className="border-b border-primary/5 bg-white">
                        <td className="px-5 py-4">
                          <strong className="block text-xs tracking-wide text-primary">
                            {group.title}
                          </strong>
                          <span className="block text-[10px] text-primary">
                            {group.description}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-primary">
                          Task total
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-primary">
                          {group.total}
                        </td>
                      </tr>
                      {group.segments.map((segment) => (
                        <tr
                          key={segment.id}
                          className="border-b border-primary/5 bg-[#faf9f7]"
                        >
                          <td className="px-5 py-4 pl-10 text-xs text-primary">
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
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
