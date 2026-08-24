"use client";

import { Pause, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTimer } from "@/context/TimerContext";

const MIN_OFFSET = 24;
const MAX_OFFSET = 300;

/** Restricts a floating timer offset to the configured viewport bounds. */
const clampOffset = (value: number) =>
  Math.min(Math.max(value, MIN_OFFSET), MAX_OFFSET);

/** Formats elapsed seconds as an `HH:MM:SS` clock-style label. */
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

/**
 * Renders the draggable floating timer control for the active task.
 *
 * The control follows the active timer state, supports bounded pointer
 * dragging, and delegates pause, resume, and stop operations to TimerContext.
 */
export const TimeTracker = () => {
  /** Current distance of the floating control from the viewport edges. */
  const [position, setPosition] = useState({
    bottom: MIN_OFFSET,
    right: MIN_OFFSET,
  });

  /** Pointer and offset values captured at the beginning of a drag gesture. */
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

  /**
   * Tracks pointer movement and releases the active drag state on pointer-up.
   * Global listeners keep dragging responsive when the pointer leaves the
   * timer element; cleanup prevents listeners from surviving unmounting.
   */
  useEffect(() => {
    /** Updates the floating timer position from the saved drag origin. */
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

    /** Ends the active drag gesture when the captured pointer is released. */
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

  /**
   * Starts a drag gesture unless the pointer began on a timer control button.
   * The initial pointer and panel offsets become the movement calculation origin.
   */
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

  /** Releases pointer capture and clears the active drag gesture. */
  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (dragState.current.pointerId === event.pointerId) {
      dragState.current.pointerId = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!activeTaskId) {
    return null;
  }

  /** Task metadata used to label the currently tracked timer. */
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
