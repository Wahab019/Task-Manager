"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ToolbarButton } from "@/components/Header";
import { useTimer } from "@/context/TimerContext";
import { Card, CardContent } from "../ui/card";

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

// Normalizes a date to the first millisecond of its local day.
function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

// Returns a new date shifted by the requested day count.
// Date navigation helpers use it without mutating the original date.
function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

// Formats elapsed seconds into a compact duration string for timeline and log displays.
// It avoids exposing raw second counts in the UI.
function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// Formats a timelog start and end timestamp into a readable range.
// Running entries fall back to an in-progress label.
function formatTimeRange(startTime: number, endTime: number | null) {
  if (endTime === null) {
    return `${timeFormatter.format(new Date(startTime))} - NOW`;
  }

  return `${timeFormatter.format(new Date(startTime))} - ${timeFormatter.format(new Date(endTime))}`;
}

// Renders the selected day timeline from completed timelogs.
// It groups task names, durations, and time ranges into dashboard activity rows.
export const DailyTimeline = () => {
  const { tasks, timelogs } = useTimer();
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfDay(new Date()),
  );

  const today = startOfDay(new Date());
  const isToday = selectedDate.getTime() === today.getTime();

  const timeline = useMemo(() => {
    const tasksById = new Map(tasks.map((task) => [task.id, task]));

    return timelogs
      .filter(
        (log) =>
          startOfDay(new Date(log.startTime)).getTime() ===
          selectedDate.getTime(),
      )
      .slice()
      .sort((a, b) => a.startTime - b.startTime)
      .map((log, index) => {
        const task = tasksById.get(log.taskId);
        const active = log.endTime === null;
        const tone = active
          ? "bg-secondary"
          : index % 2 === 0
            ? "bg-primary"
            : "bg-secondary";

        return {
          id: log.id,
          time: active
            ? `${timeFormatter.format(new Date(log.startTime))} - NOW`
            : formatTimeRange(log.startTime, log.endTime),
          title: task?.title ?? "Deleted task",
          duration: active ? "Active" : formatDuration(log.duration),
          tone,
          active,
        };
      });
  }, [selectedDate, tasks, timelogs]);

  const dateLabel = isToday
    ? `Today, ${dayFormatter.format(selectedDate)}`
    : dayFormatter.format(selectedDate);

  // Moves the current view to the previous day.
  function goToPreviousDay() {
    setSelectedDate((current) => startOfDay(addDays(current, -1)));
  }

  // Moves the current view to the next day.
  function goToNextDay() {
    if (isToday) return;
    setSelectedDate((current) => startOfDay(addDays(current, 1)));
  }

  return (
    <>
      <Card className="rounded-lg border border-primary/10 bg-white p-5 xl:col-span-7 max-h-100 xl:max-h-[701.11px] scroll-fade daily-timeline overflow-auto">
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-semibold text-primary">
              Daily Timeline
            </h2>
            <div className="flex items-center gap-2">
              <ToolbarButton label="Previous day" onClick={goToPreviousDay}>
                <ChevronLeft />
              </ToolbarButton>
              <span className="text-xs font-bold tracking-wider text-primary uppercase">
                {dateLabel}
              </span>
              <ToolbarButton
                label="Next day"
                onClick={goToNextDay}
                disabled={isToday}
              >
                <ChevronRight />
              </ToolbarButton>
            </div>
          </div>
          {timeline.length > 0 ? (
            <div className="ml-2 space-y-7 border-l border-primary/15 pl-8">
              {timeline.map((item) => (
                <div
                  className="relative flex flex-col justify-between gap-2 sm:flex-row sm:items-center"
                  key={item.id}
                >
                  <span
                    className={`absolute -left-10.25 top-1 size-4 rounded-full border-4 border-white ring-1 ring-primary/20 ${item.tone} ${item.active ? "animate-pulse" : ""}`}
                  />
                  <div>
                    <p
                      className={`text-xs font-bold ${item.active ? "text-[#745b1b]" : "text-[#6e746f]"}`}
                    >
                      {item.time}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {item.title}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded px-2 py-1 text-xs font-semibold ${item.active ? "bg-[#ffdc8e] text-[#795f1f]" : "bg-[#eae7e7] text-primary"}`}
                  >
                    {item.duration}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-40 items-center justify-center text-sm text-[#6e746f]">
              No time logged this day.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
