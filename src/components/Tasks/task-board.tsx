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

/** Labels displayed above each task status column. */
const STATUS_LABELS: Record<Task["status"], string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

/**
 * Renders the full task board and coordinates drag-and-drop status changes.
 *
 * Tasks are read from TimerContext, grouped by status, and passed to the
 * corresponding columns. Only the To Do column receives the task-creation
 * adapter because new tasks enter the board in that status.
 */
export function TaskBoard() {
  const { tasks, isLoading, error, addTask, updateTaskStatus } = useTimer();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  /**
   * Adapts the column form's task shape to TimerContext's add-task contract.
   *
   * The column keeps estimated minutes nullable for form semantics, while the
   * context API receives the value as the string expected by its persistence
   * layer. Creation is intentionally fire-and-forget because the column's
   * callback accepts a synchronous return type.
   */
  function handleAddTaskForColumn(task: {
    priority: Priority;
    title: string;
    description: string;
    estimatedMinutes: number | null;
    deadline: string | null;
  }) {
    const time =
      task.estimatedMinutes != null ? String(task.estimatedMinutes) : "0";
    void addTask({
      priority: task.priority,
      title: task.title,
      description: task.description,
      time,
      deadline: task.deadline,
    });
  }

  /**
   * Persists the status represented by the drop target after a drag ends.
   *
   * Drops outside a registered column are ignored. The context owns the
   * actual status update and any resulting persistence or error handling.
   */
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task["status"];

    await updateTaskStatus(taskId, newStatus);
  }

  /** Groups the context tasks into the three board columns by status. */
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
