"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTimer } from "@/context/TimerContext";

/**
 * Displays the total duration of time logs that started today.
 *
 * The card derives its value from TimerContext on each render. It uses a
 * browser guard so the server and initial client render share the `00:00`
 * fallback before local date calculations are performed.
 */
export const TodaysTotal = () => {
  const { timeLogs } = useTimer();
  /** Prevents local date calculations from changing the server-rendered HTML. */
  const mounted = typeof window !== "undefined";

  /** Default display used during server rendering and before browser access. */
  let formattedTime = "00:00";

  if (mounted) {
    /** Local calendar date used to identify today's time-log entries. */
    const todayStr = new Date().toDateString();
    /** Logs whose start timestamp falls on the current local calendar date. */
    const todaysLogs = timeLogs.filter((log) => {
      const logDate = new Date(log.startTime);
      return logDate.toDateString() === todayStr;
    });
    /** Total tracked seconds from today's log entries. */
    const totalSeconds = todaysLogs.reduce((acc, log) => acc + log.duration, 0);
    /** Whole hours extracted from the day's total for the card label. */
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    /** Remaining whole minutes after removing complete hours. */
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    /** Compact hours-and-minutes value displayed to the user. */
    formattedTime = `${hours}:${minutes}`;
  }

  return (
    <>
      <Card className="relative overflow-hidden rounded-lg border border-[#89671b] bg-white p-5 lg:col-span-4">
        <CardContent>
          <p className="text-[10px] font-bold tracking-[0.12em] text-[#795f1f] uppercase">
            Today&apos;s total
          </p>
          <p className="mt-2 font-heading text-6xl font-semibold text-primary">
            {formattedTime}
            <span className="ml-1 font-sans text-sm">hrs</span>
          </p>
        </CardContent>
      </Card>
    </>
  );
};
