"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { CirclePlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { TaskCard } from "./task-card";
import { CompletedTask } from "./task-completed";
import { OngoingTask } from "./task-ongoing";
import { useTimer } from "@/context/TimerContext";

/** Priority levels available when creating or displaying a task. */
export type Priority = "low" | "normal" | "high";

/** Task data required by the board's status columns and task cards. */
export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: "todo" | "in_progress" | "done";
  estimatedMinutes: number | null;
  deadline: string | null;
  elapsedSeconds: number;
  $updatedAt?: string;
};

/** Raw values maintained by the new-task form before submission. */
type DraftTask = {
  priority: Priority | "";
  title: string;
  description: string;
  time: string;
  deadline: string;
};

/** Date scopes supported by the completed-task filter. */
type DoneScope = "this-week" | "today";

/** Formats a number of seconds as an `HH:MM:SS` clock-style label. */
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

/**
 * Formats an optional minute estimate for display on an in-progress task.
 * Returns `null` when the estimate is missing or not positive.
 */
const formatEstimatedTime = (totalMinutes: number | null): string | null => {
  if (!totalMinutes || totalMinutes <= 0) {
    return null;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${totalMinutes} Minutes`;
  }

  if (minutes === 0) {
    return `${hours}hr${hours === 1 ? "" : "s"}`;
  }

  return `${hours}hr ${minutes}Mins`;
};

/** Returns whether a date falls within the half-open `[start, end)` range. */
const isWithinDateRange = (date: Date, start: Date, end: Date) =>
  date.getTime() >= start.getTime() && date.getTime() < end.getTime();

/** Values emitted by the task creation form to its parent board. */
type NewTaskInput = {
  priority: Priority;
  title: string;
  description: string;
  estimatedMinutes: number | null;
  deadline: string | null;
};

/** Properties accepted by {@link TaskColumn}. */
type TaskColumnProps = {
  title: string;
  status: Task["status"];
  tasks: Task[];
  onAddTask?: (task: NewTaskInput) => void;
};

/**
 * Renders one kanban status column with filtering, task creation, and task
 * controls. Completed tasks can be narrowed to today or the current week.
 */
export function TaskColumn({
  title,
  status,
  tasks,
  onAddTask,
}: TaskColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  const [showForm, setShowForm] = useState(false);
  const [doneScope, setDoneScope] = useState<DoneScope>("today");
  const [draftTask, setDraftTask] = useState<DraftTask>({
    priority: "",
    title: "",
    description: "",
    time: "",
    deadline: "",
  });

  const {
    activeTaskId,
    isTracking,
    currentSeconds,
    startTask,
    pauseActiveTask,
    resumeActiveTask,
    stopTask,
  } = useTimer();

  /** Switches the active task between paused and running states. */
  const handleTogglePause = () => {
    if (isTracking) {
      pauseActiveTask();
    } else {
      resumeActiveTask();
    }
  };

  const isToDoColumn = title === "To Do";
  const isDoneColumn = title === "Done";

  /** Applies the selected calendar scope when this is the Done column. */
  const filteredDoneTasks = isDoneColumn
    ? tasks.filter((task) => {
        if (!task.$updatedAt) {
          return false;
        }

        const updatedAt = new Date(task.$updatedAt);
        if (Number.isNaN(updatedAt.getTime())) {
          return false;
        }

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        if (doneScope === "today") {
          const startOfTomorrow = new Date(startOfToday);
          startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

          return isWithinDateRange(updatedAt, startOfToday, startOfTomorrow);
        }

        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfNextWeek = new Date(startOfWeek);
        startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

        return isWithinDateRange(updatedAt, startOfWeek, startOfNextWeek);
      })
    : tasks;

  const visibleTasks = isDoneColumn ? filteredDoneTasks : tasks;
  const visibleCount = visibleTasks.length;
  const totalDoneCount = tasks.length;
  const isFilteringDoneTasks = isDoneColumn && visibleCount < totalDoneCount;
  const countDisplay = isDoneColumn ? visibleCount : tasks.length;
  const formattedVisibleCount = String(countDisplay).padStart(2, "0");

  /**
   * Validates and submits the new-task form, then resets its local draft.
   *
   * Empty required fields abort submission. The duration is converted from
   * its raw string representation only when it is a finite positive number.
   */
  const handleAddTask = () => {
    if (
      !draftTask.priority ||
      !draftTask.title.trim() ||
      !draftTask.description.trim()
    ) {
      return;
    }

    const parsedMinutes = Number(draftTask.time);
    const estimatedMinutes =
      draftTask.time.trim() &&
      Number.isFinite(parsedMinutes) &&
      parsedMinutes > 0
        ? parsedMinutes
        : null;

    onAddTask?.({
      priority: draftTask.priority,
      title: draftTask.title,
      description: draftTask.description,
      estimatedMinutes,
      deadline: draftTask.deadline || null,
    });

    setDraftTask({
      priority: "",
      title: "",
      description: "",
      time: "",
      deadline: "",
    });
    setShowForm(false);
  };

  return (
    <section>
      <div className="mb-5 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold tracking-[0.08em] text-[#747974] uppercase">
            {title}
          </h2>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              title === "In Progress"
                ? "bg-[#ffdf9b] text-[#795f1f]"
                : title === "Done"
                  ? "bg-[#bdedda] text-primary"
                  : "bg-[#ecebea] text-[#646964]"
            }`}
          >
            {formattedVisibleCount}
          </span>
        </div>
        {isDoneColumn && (
          <Select
            value={doneScope}
            onValueChange={(value) => setDoneScope(value as DoneScope)}
          >
            <SelectTrigger className="h-7 w-auto border-primary/10 bg-white px-2 text-[11px] text-[#747974] shadow-sm">
              <SelectValue
                className={"font-semibold"}
                placeholder="This Week"
              />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="today">Today</SelectItem>
            </SelectContent>
          </Select>
        )}
        {isToDoColumn && (
          <button
            type="button"
            aria-label="Add task"
            className="text-primary hover:text-secondary"
            onClick={() => setShowForm((currentState) => !currentState)}
          >
            <CirclePlus className="size-5" />
          </button>
        )}
      </div>

      {showForm && isToDoColumn && (
        <div className="mb-5 rounded-lg border border-primary/10 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <Select
              value={draftTask.priority}
              onValueChange={(value) =>
                setDraftTask((currentTask) => ({
                  ...currentTask,
                  priority: (value as Priority) ?? "",
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={draftTask.title}
              onChange={(event) =>
                setDraftTask((currentTask) => ({
                  ...currentTask,
                  title: event.target.value,
                }))
              }
              placeholder="Title"
            />
            <div className="space-y-1">
              <Input
                type="number"
                min={1}
                step={1}
                value={draftTask.time}
                onChange={(event) =>
                  setDraftTask((currentTask) => ({
                    ...currentTask,
                    time: event.target.value,
                  }))
                }
                placeholder="Estimated Time in Minutes"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#747974]">
                Deadline
              </label>
              <Input
                type="date"
                value={draftTask.deadline}
                onChange={(event) =>
                  setDraftTask((currentTask) => ({
                    ...currentTask,
                    deadline: event.target.value,
                  }))
                }
              />
            </div>
            <Textarea
              value={draftTask.description}
              onChange={(event) =>
                setDraftTask((currentTask) => ({
                  ...currentTask,
                  description: event.target.value,
                }))
              }
              placeholder="Description"
              className="min-h-24"
            />
            <button
              type="button"
              onClick={handleAddTask}
              className="rounded bg-primary px-3 py-2 text-xs font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div
        ref={setNodeRef}
        className={`min-h-24 space-y-5 rounded-lg transition-colors ${
          isOver ? "bg-primary/5" : ""
        }`}
      >
        {tasks.length > 0 ? (
          visibleTasks.map((task) => {
            if (task.status === "done") {
              return (
                <CompletedTask
                  key={task.id}
                  title={task.title}
                  description={task.description}
                  time={formatSeconds(task.elapsedSeconds)}
                  completedAt={task.$updatedAt ?? new Date().toISOString()}
                />
              );
            }

            if (task.status === "in_progress") {
              /** Resumes this task through TimerContext from the column list. */
              const handleResumeTask = () => {
                startTask(task.id);
              };

              return (
                <OngoingTask
                  key={task.id}
                  id={task.id}
                  priority={task.priority}
                  title={task.title}
                  description={task.description}
                  estimatedMinutes={task.estimatedMinutes}
                  time={formatEstimatedTime(task.estimatedMinutes)}
                  deadline={task.deadline}
                  elapsedSeconds={
                    task.id === activeTaskId
                      ? currentSeconds
                      : task.elapsedSeconds
                  }
                  isTracking={task.id === activeTaskId ? isTracking : false}
                  onPause={
                    task.id === activeTaskId
                      ? handleTogglePause
                      : handleResumeTask
                  }
                  onStop={() => stopTask(task.id)}
                />
              );
            }

            const actionText = task.status === "todo" ? "Start" : "Resume";
            return (
              <TaskCard
                key={task.id}
                id={task.id}
                priority={task.priority}
                title={task.title}
                description={task.description}
                estimatedMinutes={task.estimatedMinutes}
                deadline={task.deadline}
                action={actionText}
              />
            );
          })
        ) : (
          <p className="px-1 text-sm text-[#747974]">No tasks yet</p>
        )}
      </div>
      {isFilteringDoneTasks && (
        <p className="mt-3 px-1 text-xs text-[#8a908c]">
          Showing {visibleCount} of {totalDoneCount} completed
        </p>
      )}
    </section>
  );
}
