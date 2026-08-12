"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Priority, Task } from "@/context/TimerContext";

export type TaskEditUpdates = {
  title: string;
  description: string;
  priority: Priority;
  estimatedMinutes: number | null;
  deadline: string | null;
};

type EditDraft = {
  priority: Priority;
  title: string;
  description: string;
  time: string;
  deadline: string;
};

// Defines the Edit Task Dialog behavior used in this module.
export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onSave,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: TaskEditUpdates) => Promise<void>;
}) {
  const [draft, setDraft] = useState<EditDraft>({
    priority: task.priority,
    title: task.title,
    description: task.description,
    time: task.estimatedMinutes ? String(task.estimatedMinutes) : "",
    deadline: task.deadline ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setDraft({
      priority: task.priority,
      title: task.title,
      description: task.description,
      time: task.estimatedMinutes ? String(task.estimatedMinutes) : "",
      deadline: task.deadline ?? "",
    });
    setError(null);
  }, [open, task.id]);

  // Handles the submit interaction.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.title.trim() || !draft.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    const parsedMinutes = Number(draft.time);
    const estimatedMinutes =
      draft.time.trim() && Number.isFinite(parsedMinutes) && parsedMinutes > 0
        ? parsedMinutes
        : null;

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        title: draft.title.trim(),
        description: draft.description.trim(),
        priority: draft.priority,
        estimatedMinutes,
        deadline: draft.deadline.trim() ? draft.deadline.trim() : null,
      });
      onOpenChange(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't update the task. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Update the task details.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Select
            value={draft.priority}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                priority: value as Priority,
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
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Title"
          />
          <Input
            type="number"
            min={1}
            step={1}
            value={draft.time}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                time: event.target.value,
              }))
            }
            placeholder="Estimated Time in Minutes"
          />
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#747974]">
              Deadline
            </label>
            <Input
              type="date"
              value={draft.deadline}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  deadline: event.target.value,
                }))
              }
            />
          </div>
          <Textarea
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Description"
            className="min-h-24"
          />
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
