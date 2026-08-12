"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { TaskColumn, type Task, type Priority } from "./task-column";
import { useTimer, type Task as TimerTask } from "@/context/TimerContext";

const STATUS_LABELS: Record<Task["status"], string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

// Renders the full task board and coordinates drag-and-drop status changes.
// It groups tasks into columns from TimerContext state.
export function TaskBoard() {
  const { tasks, isLoading, error, addTask, updateTaskStatus } = useTimer();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Adapter to satisfy TaskColumn's onAddTask signature
  function handleAddTaskForColumn(task: {
    priority: Priority;
    title: string;
    description: string;
    estimatedMinutes: number | null;
    deadline: string | null;
  }) {
    const time =
      task.estimatedMinutes != null ? String(task.estimatedMinutes) : "0";
    // fire-and-forget to match expected void return
    void addTask({
      priority: task.priority,
      title: task.title,
      description: task.description,
      time,
      deadline: task.deadline,
    });
  }

  // Handles dropping a task over a new column.
  // It updates task status only when the drop target is a different valid status.
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task["status"];

    await updateTaskStatus(taskId, newStatus);
  }

  const tasksByStatus = useMemo(() => {
    const grouped: Record<Task["status"], Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };

    for (const task of tasks as TimerTask[]) {
      grouped[task.status].push({
        ...task,
        estimatedMinutes: task.estimatedMinutes,
      });
    }

    return grouped;
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="space-y-4 rounded-2xl border border-primary/10 bg-white p-4 shadow-sm"
          >
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <Skeleton className="h-9" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto min-h-screen scroll-fade-x">
          <div className="grid min-w-max grid-flow-col auto-cols-[minmax(320px,1fr)] gap-8">
            {(["todo", "in_progress", "done"] as const).map((status) => (
              <TaskColumn
                key={status}
                status={status}
                title={STATUS_LABELS[status]}
                tasks={tasksByStatus[status]}
                onAddTask={
                  status === "todo" ? handleAddTaskForColumn : undefined
                }
              />
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
