"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo } from "react";

import { TaskColumn, type Task, type Priority } from "./task-column";
import { useTimer } from "@/context/TimerContext";

const STATUS_LABELS: Record<Task["status"], string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export function TaskBoard() {
  const { tasks, isLoading, error, addTask, updateTaskStatus } = useTimer();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  async function handleAddTask(draft: {
    priority: Priority;
    title: string;
    description: string;
    time: string;
    deadline: string | null;
  }) {
    await addTask(draft);
  }

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

    for (const task of tasks) {
      grouped[task.status].push(task);
    }

    return grouped;
  }, [tasks]);

  if (isLoading) {
    return <p className="px-1 text-sm text-[#747974]">Loading tasks…</p>;
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto min-h-screen">
          <div className="grid min-w-max grid-flow-col auto-cols-[minmax(320px,1fr)] gap-8">
            {(["todo", "in_progress", "done"] as const).map((status) => (
              <TaskColumn
                key={status}
                status={status}
                title={STATUS_LABELS[status]}
                tasks={tasksByStatus[status]}
                onAddTask={status === "todo" ? handleAddTask : undefined}
              />
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
