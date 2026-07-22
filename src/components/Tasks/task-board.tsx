"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { TaskColumn, type Task, type Priority } from "./task-column";

const STATUS_LABELS: Record<Task["status"], string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchTasks() {
      try {
        const response = await axios.get<Task[]>("/api/tasks");
        if (isMounted) setTasks(response.data);
      } catch {
        if (isMounted) setError("Couldn't load tasks. Try refreshing.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchTasks();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleAddTask(draft: {
    priority: Priority;
    title: string;
    description: string;
    time: string;
  }) {
    // optimistic temp entry so the UI feels instant
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      status: "todo",
      ...draft,
    };
    setTasks((current) => [...current, optimisticTask]);

    try {
      const response = await axios.post<Task>("/api/tasks", {
        ...draft,
        status: "todo",
      });
      // swap the temp task for the real one returned by the server
      setTasks((current) =>
        current.map((task) => (task.id === tempId ? response.data : task)),
      );
    } catch {
      // roll back on failure
      setTasks((current) => current.filter((task) => task.id !== tempId));
      setError("Couldn't create the task. Try again.");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task["status"];

    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    const previousStatus = currentTask.status;

    // optimistic update
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    );

    try {
      await axios.patch(`/api/tasks/${taskId}`, { status: newStatus });
    } catch {
      // roll back on failure
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, status: previousStatus } : task,
        ),
      );
      setError("Couldn't update task status. Try again.");
    }
  }

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
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {(["todo", "in_progress", "done"] as const).map((status) => (
            <TaskColumn
              key={status}
              status={status}
              title={STATUS_LABELS[status]}
              tasks={tasks.filter((task) => task.status === status)}
              onAddTask={status === "todo" ? handleAddTask : undefined}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
