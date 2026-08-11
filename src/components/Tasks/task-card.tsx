"use client";

import { useDraggable } from "@dnd-kit/core";
import { CalendarClock, Clock, Ellipsis, Play } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Pill } from "./pill";
import { Card, CardContent } from "@/components/ui/card";
import { useTimer, type Priority, type Task } from "@/context/TimerContext";
import { formatDueLabel } from "@/lib/utils";
import { EditTaskDialog, type TaskEditUpdates } from "./edit-task-dialog";

export function TaskCard({
  id,
  priority,
  title,
  description,
  estimatedMinutes,
  deadline,
  action,
}: {
  id: string;
  priority: Priority;
  title: string;
  description: string;
  estimatedMinutes: number | null;
  deadline: string | null;
  action: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const { startTask, getTotalDurationForTask, updateTask, deleteTask } =
    useTimer();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalSeconds = getTotalDurationForTask(id);
  const totalHours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const displayTotal = `${totalHours}:${totalMinutes}`;
  const deadlineLabel = deadline ? formatDueLabel(deadline) : "";
  const isPending = id.startsWith("temp-");

  const handleAction = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (isPending) return;
    startTask(id);
  };

  const task: Task = {
    id,
    priority,
    title,
    description,
    status: "todo",
    estimatedMinutes,
    deadline,
    elapsedSeconds: totalSeconds,
  };

  const handleSave = async (updates: TaskEditUpdates) => {
    await updateTask(id, updates);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteTask(id);
      setIsDeleteOpen(false);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Couldn't delete the task. Try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`max-w-100 touch-none rounded-lg border border-primary/10 bg-white p-5 shadow-sm transition-opacity ${
          isDragging ? "cursor-grabbing opacity-50" : "cursor-grab"
        }`}
        style={{
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        }}
      >
        <CardContent>
          <div className="flex items-start justify-between">
            <Pill>{priority} PRIORITY</Pill>
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                aria-label="options"
                className="text-[#aeb2ad] cursor-pointer"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <Ellipsis className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsEditOpen(true);
                  }}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-700 data-highlighted:bg-red-50"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteError(null);
                    setIsDeleteOpen(true);
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h3 className="mt-5 font-heading text-xl font-semibold text-primary">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-5 text-primary">{description}</p>
          {deadlineLabel && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#6e746f]">
              <CalendarClock className="size-4" />
              <span className="font-semibold">{deadlineLabel}</span>
            </div>
          )}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#6e746f]">
              <Clock className="size-4" /> {displayTotal}
            </div>
            <Button
              variant="heritage-gold"
              size="sm"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={handleAction}
              disabled={isPending}
            >
              <Play className="size-3 fill-current" />{" "}
              {isPending ? "Saving..." : action}
            </Button>
          </div>
        </CardContent>
      </Card>
      <EditTaskDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleSave}
      />
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-sm font-medium"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
