"use client";

import { useDraggable } from "@dnd-kit/core";
import { Clock, Ellipsis, Play } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Pill } from "./pill";
import { Card, CardContent } from "@/components/ui/card";
import { useTimer } from "@/context/TimerContext";

export function TaskCard({
  id,
  priority,
  title,
  description,
  action,
}: {
  id: string;
  priority: string;
  title: string;
  description: string;
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
        <div className="mt-6 flex justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> {displayTotal}
          </div>
          <Button variant="heritage-gold" size="sm" onClick={handleAction}>
            <Play className="size-3 fill-current" /> {action}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
