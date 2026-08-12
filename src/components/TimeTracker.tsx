"use client";

import { Pause, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTimer } from "@/context/TimerContext";

const MIN_OFFSET = 24;
const MAX_OFFSET = 300;

// Constrains the floating timer offset so it stays within the viewport.
// Dragging uses it to avoid losing the control off-screen.
const clampOffset = (value: number) =>
  Math.min(Math.max(value, MIN_OFFSET), MAX_OFFSET);

// Formats seconds into a clock-style duration label.
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

// Renders the draggable floating timer control for the active task.
// It switches between pause and resume actions based on tracking state.
export const TimeTracker = () => {
  const [position, setPosition] = useState({
    bottom: MIN_OFFSET,
    right: MIN_OFFSET,
  });
  const dragState = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    startRight: MIN_OFFSET,
    startBottom: MIN_OFFSET,
  });

  const {
    tasks,
    activeTaskId,
    isTracking,
    currentSeconds,
    pauseActiveTask,
    resumeActiveTask,
    stopActiveTask,
  } = useTimer();

  useEffect(() => {
    // Updates the floating timer position during a drag gesture.
    // It uses the saved drag origin to calculate a bounded offset.
    const handlePointerMove = (event: PointerEvent) => {
      if (dragState.current.pointerId === null) {
        return;
      }

      const deltaX = dragState.current.startX - event.clientX;
      const deltaY = dragState.current.startY - event.clientY;

      setPosition({
        right: clampOffset(dragState.current.startRight + deltaX),
        bottom: clampOffset(dragState.current.startBottom + deltaY),
      });
    };

    // Ends pointer capture and finalizes click-versus-drag state.
    // This keeps dragging the floating timer from accidentally triggering controls.
    const handlePointerUp = (event: PointerEvent) => {
      if (dragState.current.pointerId === event.pointerId) {
        dragState.current.pointerId = null;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  // Starts pointer capture for dragging the floating timer.
  // It records the initial pointer and panel offset before movement begins.
  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }

    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRight: position.right,
      startBottom: position.bottom,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  // Ends pointer capture and finalizes click-versus-drag state.
  // This keeps dragging the floating timer from accidentally triggering controls.
  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (dragState.current.pointerId === event.pointerId) {
      dragState.current.pointerId = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!activeTaskId) {
    return null;
  }

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  if (!activeTask) {
    return null;
  }

  return (
    <aside
      className="fixed z-10 hidden lg:flex min-w-67 cursor-grab items-center gap-5 rounded-xl bg-[#003b2d] px-5 py-4 text-white shadow-[0_18px_40px_rgba(11,59,46,0.25)] active:cursor-grabbing print:hidden"
      style={{
        bottom: `${position.bottom}px`,
        right: `${position.right}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div>
        <p className="text-[9px] tracking-[0.12em] text-[#a2d0be] uppercase max-w-44 truncate">
          Tracking: {activeTask.title}
        </p>
        <p className="mt-1 font-mono text-lg font-bold">
          {formatSeconds(currentSeconds)}
        </p>
      </div>
      <span className="h-8 w-px bg-white/15" />
      {isTracking ? (
        <button
          aria-label="Pause timer"
          className="flex size-9 items-center justify-center rounded-lg bg-[#866719] text-white cursor-pointer hover:opacity-90"
          onPointerDown={(event) => {
            event.stopPropagation();
            pauseActiveTask();
          }}
        >
          <Pause className="size-4 fill-current" />
        </button>
      ) : (
        <button
          aria-label="Resume timer"
          className="flex size-9 items-center justify-center rounded-lg bg-[#006e51] text-white cursor-pointer hover:opacity-90 animate-pulse"
          onPointerDown={(event) => {
            event.stopPropagation();
            resumeActiveTask();
          }}
        >
          <Play className="size-4 fill-current" />
        </button>
      )}
      <button
        aria-label="Stop timer"
        className="flex size-9 items-center justify-center rounded-lg bg-[#cf2525] text-white cursor-pointer hover:opacity-90"
        onPointerDown={(event) => {
          event.stopPropagation();
          stopActiveTask();
        }}
      >
        <Square className="size-3 fill-current" />
      </button>
    </aside>
  );
};
