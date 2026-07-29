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

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
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

function formatTimeRange(startTime: number, endTime: number) {
  return `${timeFormatter.format(new Date(startTime))} - ${timeFormatter.format(new Date(endTime))}`;
}

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

  function goToPreviousDay() {
    setSelectedDate((current) => startOfDay(addDays(current, -1)));
  }

  function goToNextDay() {
    if (isToday) return;
    setSelectedDate((current) => startOfDay(addDays(current, 1)));
  }

  return (
    <>
      <Card className="rounded-lg border border-primary/10 bg-white p-5 xl:col-span-7">
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
