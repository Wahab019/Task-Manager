"use client";

import { useDraggable } from "@dnd-kit/core";
import { CalendarClock, Clock, Ellipsis, Play } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Pill } from "./pill";
import { Card, CardContent } from "@/components/ui/card";
import { useTimer } from "@/context/TimerContext";
import { formatDueLabel } from "@/lib/utils";

export function TaskCard({
  id,
  priority,
  title,
  description,
  deadline,
  action,
}: {
  id: string;
  priority: string;
  title: string;
  description: string;
  deadline: string | null;
  action: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const { startTask, getTotalDurationForTask } = useTimer();

  const totalSeconds = getTotalDurationForTask(id);
  const totalHours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const displayTotal = `${totalHours}:${totalMinutes}`;
  const deadlineLabel = deadline ? formatDueLabel(deadline) : "";

  const handleAction = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    startTask(id);
  };

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none rounded-lg border border-primary/10 bg-white p-5 shadow-sm transition-opacity ${
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
          <button
            aria-label={`Options for ${title}`}
            className="text-[#aeb2ad]"
            onClick={(event) => event.stopPropagation()}
          >
            <Ellipsis className="size-5" />
          </button>
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
          <Button variant="heritage-gold" size="sm" onClick={handleAction}>
            <Play className="size-3 fill-current" /> {action}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
