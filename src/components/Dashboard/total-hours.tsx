"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { useTimer } from "@/context/TimerContext";

function getWeekBounds(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function sumLogsInRange(
  timeLogs: { startTime: string; duration: number }[],
  monday: Date,
  sunday: Date,
) {
  return timeLogs
    .filter((log) => {
      const start = new Date(log.startTime);
      return start >= monday && start <= sunday;
    })
    .reduce((acc, log) => acc + log.duration, 0);
}

export const TotalHours = () => {
  const { timeLogs } = useTimer();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  let displayHours = "0h 00m";
  let deltaLabel = "No data from last week";
  let isUp = true;
  let hasDelta = false;

  if (mounted) {
    const { monday: thisMonday, sunday: thisSunday } = getWeekBounds(0);
    const { monday: lastMonday, sunday: lastSunday } = getWeekBounds(-1);

    const thisWeekSeconds = sumLogsInRange(timeLogs, thisMonday, thisSunday);
    const lastWeekSeconds = sumLogsInRange(timeLogs, lastMonday, lastSunday);

    const thisH = Math.floor(thisWeekSeconds / 3600);
    const thisM = Math.floor((thisWeekSeconds % 3600) / 60);
    displayHours = `${thisH}h ${String(thisM).padStart(2, "0")}m`;

    const deltaSeconds = thisWeekSeconds - lastWeekSeconds;
    const deltaH = Math.abs(deltaSeconds / 3600);
    isUp = deltaSeconds >= 0;
    hasDelta = lastWeekSeconds > 0 || thisWeekSeconds > 0;

    if (hasDelta) {
      const sign = isUp ? "+" : "-";
      deltaLabel = `${sign}${deltaH.toFixed(1)}h from last week`;
    }
  }

  const TrendIcon = isUp ? TrendingUp : TrendingDown;
  const deltaColor = isUp ? "text-[#ffdf9b]" : "text-[#f6a19a]";

  return (
    <>
      <Card className="relative overflow-hidden rounded-lg bg-primary p-5 text-white shadow-lg lg:col-span-4">
        <CardContent>
          <div className="flex items-center justify-between">
            <TrendingUp className="size-8 text-[#ffdf9b]" />
            <span className="rounded bg-white/10 px-2 py-1 text-xs font-semibold">
              THIS WEEK
            </span>
          </div>
          <p className="mt-8 text-sm text-white/75">Total Hours Worked</p>
          <p className="mt-1 font-heading text-5xl font-semibold text-[#ffdf9b]">
            {displayHours}
          </p>
          <div
            className={`mt-8 flex items-center gap-2 border-t border-white/15 pt-5 text-xs font-semibold ${deltaColor}`}
          >
            <TrendIcon className="size-4" />
            {deltaLabel}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
