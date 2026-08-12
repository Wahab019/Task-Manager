"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pause, Play, Square } from "lucide-react";
import { useTimer } from "@/context/TimerContext";

// Defines the Avatar behavior used in this module.
export function Avatar({ initials, tone }: { initials: string; tone: string }) {
  return (
    <span
      className={`flex size-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-primary ${tone}`}
    >
      {initials}
    </span>
  );
}

// Formats seconds into a clock-style duration label.
const formatSeconds = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// Defines the Dashboard Progress behavior used in this module.
export const DashboardProgress = () => {
  const {
    tasks,
    activeTaskId,
    isTracking,
    currentSeconds,
    startTask,
    pauseActiveTask,
    resumeActiveTask,
    stopActiveTask,
    updateTaskStatus,
    getTotalDurationForTask,
  } = useTimer();

  // Find the task to display
  const activeTask = activeTaskId
    ? tasks.find((t) => t.id === activeTaskId)
    : null;

  // Fallback to first in-progress task if no active task is selected/tracking
  const fallbackTask = tasks.find((t) => t.status === "in_progress") || null;
  const displayedTask = activeTask ?? fallbackTask;
  const isActive = !!activeTask;

  // Handle resume/start from the dashboard
  const handleToggle = () => {
    if (!displayedTask) return;
    if (isActive) {
      if (isTracking) {
        pauseActiveTask();
      } else {
        resumeActiveTask();
      }
    } else {
      startTask(displayedTask.id);
    }
  };

  // Handles the stop interaction.
  const handleStop = () => {
    if (!displayedTask) return;
    if (isActive) {
      stopActiveTask();
    } else {
      updateTaskStatus(displayedTask.id, "done");
    }
  };

  const hasTask = !!displayedTask;
  const title = displayedTask ? displayedTask.title : "No ongoing tasks";
  const description = displayedTask
    ? displayedTask.description
    : "Go to the tasks board to start a task.";
  const displaySeconds = isActive
    ? currentSeconds
    : displayedTask
      ? getTotalDurationForTask(displayedTask.id)
      : 0;
  const isCurrentlyTracking = isActive && isTracking;

  return (
    <>
      <Card className="relative overflow-hidden rounded-lg border border-primary/10 bg-white p-5 shadow-sm lg:col-span-8">
        <CardContent>
          <div className="absolute inset-y-0 left-0 w-1 bg-secondary" />
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <span className="inline-flex rounded bg-[#ffdc8e] px-2 py-1 text-xs font-bold tracking-wide text-[#795f1f]">
                IN PROGRESS
              </span>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-primary">
                {title}
              </h2>
              <p className="mt-1 text-sm text-[#6e746f]">{description}</p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p className="font-mono text-3xl font-semibold tracking-wider text-primary">
                {formatSeconds(displaySeconds)}
              </p>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-[#6e746f] uppercase">
                Session duration
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-end gap-4 border-t border-primary/10 pt-5">
            {/* <div className="flex -space-x-2">
              <Avatar initials="JD" tone="bg-[#bdedda]" />
              <Avatar initials="AM" tone="bg-[#ffdf9b]" />
            </div> */}

            <div className="flex gap-2">
              <Button
                variant="heritage-outline"
                size="sm"
                onClick={handleToggle}
                disabled={!hasTask}
              >
                {isCurrentlyTracking ? (
                  <>
                    <Pause /> Pause
                  </>
                ) : (
                  <>
                    <Play className="size-3 fill-current" /> Resume
                  </>
                )}
              </Button>
              <Button
                variant="heritage"
                size="sm"
                onClick={handleStop}
                disabled={!hasTask}
              >
                <Square className="size-3 fill-current" /> Stop timer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
