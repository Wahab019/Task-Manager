"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTimer } from "@/context/TimerContext";

/**
 * Builds the local calendar bounds for the current Monday-to-Sunday week.
 * The returned timestamps are used to filter time logs for weekly progress.
 */
function getWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon, …, 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

/** Formats elapsed seconds as the `HH:MM` label used by the progress card. */
function formatHoursMinutes(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Displays progress toward a weekly target and lets the user edit that target.
 *
 * Time-log totals come from TimerContext, while the target is persisted in
 * localStorage so it remains available across browser sessions.
 */
export const WeeklyProgress = () => {
  const { timelogs } = useTimer();
  /**
   * Weekly target in hours; `null` means no target has been configured.
   * The initializer reads only in the browser to avoid server-side storage access.
   */
  const [weeklyTarget, setWeeklyTarget] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("timer_weeklyTarget");
    if (saved !== null) {
      const parsed = Number(saved);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return null;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempTarget, setTempTarget] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /** Focuses and selects the target input whenever edit mode opens. */
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  /** Opens target editing and seeds the draft from the saved target. */
  const handleEditOpen = () => {
    setTempTarget(weeklyTarget !== null ? String(weeklyTarget) : "");
    setIsEditing(true);
  };

  /**
   * Validates and persists the target draft, or clears it when left empty.
   * Invalid non-positive values leave the existing target unchanged.
   */
  const handleSave = () => {
    const trimmed = tempTarget.trim();
    if (trimmed === "") {
      setWeeklyTarget(null);
      localStorage.removeItem("timer_weeklyTarget");
    } else {
      const parsed = Number(trimmed);
      if (!isNaN(parsed) && parsed > 0) {
        setWeeklyTarget(parsed);
        localStorage.setItem("timer_weeklyTarget", String(parsed));
      }
    }
    setIsEditing(false);
  };

  /** Cancels target editing without changing the persisted target. */
  const handleCancel = () => {
    setIsEditing(false);
  };

  /** Saves on Enter and cancels on Escape while editing the target. */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  /** Accumulated seconds for the selected weekly range and current day. */
  let weeklySeconds = 0;
  let todaySeconds = 0;
  /** Percentage of the configured weekly target, capped at 100%. */
  let progressPercent = 0;

  if (typeof window !== "undefined") {
    const { monday, sunday } = getWeekBounds();
    const todayStr = new Date().toDateString();

    for (const log of timelogs) {
      const start = new Date(log.startTime);
      if (start >= monday && start <= sunday) {
        weeklySeconds += log.duration;
        if (start.toDateString() === todayStr) {
          todaySeconds += log.duration;
        }
      }
    }

    if (weeklyTarget !== null && weeklyTarget > 0) {
      progressPercent = Math.min(
        100,
        Math.round((weeklySeconds / (weeklyTarget * 3600)) * 100),
      );
    }
  }

  const weeklyFormatted = formatHoursMinutes(weeklySeconds);
  const targetFormatted =
    weeklyTarget !== null
      ? `/ ${String(weeklyTarget).padStart(2, "0")}:00`
      : "/ --:--";
  const todayHours = (todaySeconds / 3600).toFixed(1);

  return (
    <>
      <Card className="rounded-lg border border-primary/10 bg-white p-5 lg:col-span-8">
        <CardContent>
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-[0.12em] text-primary uppercase">
              Weekly progress
            </p>

            <div className="flex items-center gap-1.5">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <span className="mr-0.5 text-[10px] font-bold text-primary">
                    Target:
                  </span>
                  <input
                    ref={inputRef}
                    type="number"
                    min={1}
                    step={1}
                    value={tempTarget}
                    onChange={(e) => setTempTarget(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="hours"
                    className="w-14 rounded border border-primary/20 bg-[#f0f3f0] px-1.5 py-0.5 text-[10px] font-bold text-primary outline-none focus:border-primary"
                  />
                  <span className="text-[10px] font-bold text-primary">h</span>
                  <button
                    aria-label="Save target"
                    onClick={handleSave}
                    className="flex size-5 items-center justify-center rounded bg-primary text-white transition-opacity hover:opacity-80"
                  >
                    <Check className="size-3" />
                  </button>
                  <button
                    aria-label="Cancel editing target"
                    onClick={handleCancel}
                    className="flex size-5 items-center justify-center rounded bg-[#eae7e7] text-primary transition-opacity hover:opacity-80"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="bg-[#f0f3f0] px-2 py-1 text-[10px] font-bold text-primary">
                    {weeklyTarget !== null
                      ? `Target: ${weeklyTarget}h`
                      : "Target: NOT SET"}
                  </span>
                  <button
                    aria-label="Edit weekly target"
                    onClick={handleEditOpen}
                    className="flex size-5 items-center justify-center rounded text-primary/40 transition-colors hover:text-primary"
                  >
                    <Pencil className="size-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Time display */}
          <p className="mt-2 font-heading text-4xl font-semibold text-primary">
            {weeklyFormatted}
            <span className="ml-1 font-sans text-sm">{targetFormatted}</span>
          </p>

          {/* Progress bar */}
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#eae7e7]">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Footer */}
          <div className="mt-2 flex justify-between text-[10px] font-semibold">
            <span className="text-primary">
              {weeklyTarget !== null
                ? `${progressPercent}% of weekly goal`
                : "No target set"}
            </span>
            <span className="text-[#795f1f]">+{todayHours}h today</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
