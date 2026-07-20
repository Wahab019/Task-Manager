"use client";

import { useDraggable } from "@dnd-kit/core";
import { Ellipsis, Play } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Pill } from "./pill";
import { Card, CardContent } from "@/components/ui/card";

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
          <Pill>{priority}</Pill>
          <button
            aria-label={`Options for ${title}`}
            className="text-[#aeb2ad]"
          >
            <Ellipsis className="size-5" />
          </button>
        </div>
        <h3 className="mt-5 font-heading text-xl font-semibold text-primary">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-5 text-primary">{description}</p>
        <div className="mt-6 flex justify-end">
          <Button variant="heritage-gold" size="sm">
            <Play className="size-3 fill-current" /> {action}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
