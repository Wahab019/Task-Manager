"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTimer } from "@/context/TimerContext";

// Defines the Todays Total behavior used in this module.
export const TodaysTotal = () => {
  const { timeLogs } = useTimer();
  const mounted = typeof window !== "undefined";

  let formattedTime = "00:00";

  if (mounted) {
    const todayStr = new Date().toDateString();
    const todaysLogs = timeLogs.filter((log) => {
      const logDate = new Date(log.startTime);
      return logDate.toDateString() === todayStr;
    });
    const totalSeconds = todaysLogs.reduce((acc, log) => acc + log.duration, 0);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
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
