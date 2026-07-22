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

export type Priority = "low" | "normal" | "high";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: "todo" | "in_progress" | "done";
  time: string;
  elapsedSeconds: number;
};

type DraftTask = {
  priority: Priority | "";
  title: string;
  description: string;
  time: string;
};

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

export function TaskColumn({
  title,
  status,
  tasks,
  onAddTask,
}: {
  title: string;
  status: Task["status"];
  tasks: Task[];
  onAddTask?: (task: {
    priority: Priority;
    title: string;
    description: string;
    time: string;
  }) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  const [showForm, setShowForm] = useState(false);
  const [draftTask, setDraftTask] = useState<DraftTask>({
    priority: "",
    title: "",
    description: "",
    time: "",
  });

  const {
    activeTaskId,
    isTracking,
    currentSeconds,
    pauseActiveTask,
    stopActiveTask,
  } = useTimer();

  const formattedCount = String(tasks.length).padStart(2, "0");
  const isToDoColumn = title === "To Do";

  const handleAddTask = () => {
    if (
      !draftTask.priority ||
      !draftTask.title.trim() ||
      !draftTask.description.trim()
    ) {
      return;
    }

    onAddTask?.({
      priority: draftTask.priority,
      title: draftTask.title,
      description: draftTask.description,
      time: draftTask.time,
    });

    setDraftTask({ priority: "", title: "", description: "", time: "" });
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
            {formattedCount}
          </span>
        </div>
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
            <Input
              value={draftTask.time}
              onChange={(event) =>
                setDraftTask((currentTask) => ({
                  ...currentTask,
                  time: event.target.value,
                }))
              }
              placeholder="Time"
            />
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
          tasks.map((task) => {
            if (task.status === "done") {
              return (
                <CompletedTask
                  key={task.id}
                  title={task.title}
                  description={task.description}
                  time={formatSeconds(task.elapsedSeconds)}
                />
              );
            }

            if (task.id === activeTaskId && isTracking) {
              return (
                <OngoingTask
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  description={task.description}
                  time={task.time}
                  elapsedSeconds={currentSeconds}
                  isTracking={isTracking}
                  onPause={pauseActiveTask}
                  onStop={stopActiveTask}
                />
              );
            }

            const actionText = task.status === "todo" ? "Start" : "Resume";
            const displayTime =
              task.status === "in_progress"
                ? formatSeconds(task.elapsedSeconds)
                : task.time;

            return (
              <TaskCard
                key={task.id}
                id={task.id}
                priority={task.priority}
                title={task.title}
                description={task.description}
                action={actionText}
                time={displayTime}
              />
            );
          })
        ) : (
          <p className="px-1 text-sm text-[#747974]">No tasks yet</p>
        )}
      </div>
    </section>
  );
}
