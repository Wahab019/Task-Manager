import { Pill } from "./pill";
import { CalendarClock, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDraggable } from "@dnd-kit/core";
import { formatDueLabel } from "@/lib/utils";

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

export function OngoingTask({
  id,
  title,
  description,
  time,
  deadline,
  elapsedSeconds,
  isTracking,
  onPause,
  onStop,
}: {
  id: string;
  title: string;
  description: string;
  time: string;
  deadline: string | null;
  elapsedSeconds: number;
  isTracking: boolean;
  onPause: () => void;
  onStop: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  return (
    <>
      <Card
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`relative overflow-hidden touch-none rounded-lg border border-[#9f7a2c] bg-white p-5 shadow-[0_8px_18px_rgba(11,59,46,0.09)] transition-opacity ${
          isDragging ? "cursor-grabbing opacity-50" : "cursor-grab"
        }`}
        style={{
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        }}
      >
        <CardContent>
          <span className="absolute right-0 top-0 flex size-13 items-center justify-center rounded-bl-[22px] p-3">
            <span className="relative flex size-3">
              {isTracking && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#795f1f] opacity-75"></span>
              )}
              <span
                className={`relative inline-flex size-3 rounded-full ${
                  isTracking ? "bg-[#795f1f]" : "bg-[#aeb2ad]"
                }`}
              ></span>
            </span>
          </span>
          <Pill>In Progress</Pill>
          <h2 className="mt-5 font-heading text-xl font-semibold text-primary">
            {title}
          </h2>
          <p className="mt-1 max-w-72 text-sm leading-5 text-primary">
            {description}
          </p>
          {deadline ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#6e746f]">
              <CalendarClock className="size-4" />
              <span>{formatDueLabel(deadline)}</span>
            </div>
          ) : null}
          <div className="mt-6 flex items-center justify-between rounded bg-[#f5f3f1] px-3 py-3">
            <span className="font-mono text-lg font-bold text-[#795f1f]">
              {formatSeconds(elapsedSeconds)}
            </span>
            <span className="text-right text-[9px] leading-3 tracking-wide text-[#6e746f] uppercase">
              Est. time
              <br />
              <b className="text-xs text-primary">{time}</b>
            </span>
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              className="flex-1 cursor-pointer hover:opacity-90"
              variant="heritage-outline"
              size="lg"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onPause();
              }}
            >
              {/* <Pause className="size-4 fill-current" /> */}
              {isTracking ? (
                <>
                  <Pause className="size-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="size-4 fill-current" />
                  <span>Resume</span>
                </>
              )}
            </Button>
            <Button
              className="flex-1 cursor-pointer hover:opacity-90"
              variant="heritage"
              size="lg"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onStop();
              }}
            >
              <Square className="size-3 fill-current" /> Stop
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
