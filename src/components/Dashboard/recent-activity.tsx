"use client";

import Link from "next/link";
import { UserRoundCheck } from "lucide-react";

import { Card, CardContent } from "../ui/card";
import { useTimer } from "@/context/TimerContext";

function formatLogDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

function formatRelativeTime(endTime: string) {
  const now = Date.now();
  const then = new Date(endTime).getTime();
  const diffSeconds = Math.max(0, Math.round((now - then) / 1000));

  const minutes = Math.floor(diffSeconds / 60);
  const hours = Math.floor(diffSeconds / 3600);
  const days = Math.floor(diffSeconds / 86400);

  if (diffSeconds < 60) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export const RecentActivity = () => {
  const { tasks, timeLogs } = useTimer();

  const taskById = new Map(tasks.map((task) => [task.id, task.title]));

  const recentLogs = [...timeLogs]
    .sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
    )
    .slice(0, 3)
    .map((log) => ({
      ...log,
      title: taskById.get(log.taskId) ?? "Deleted task",
      durationLabel: formatLogDuration(log.duration),
      relativeLabel: formatRelativeTime(log.endTime),
    }));

  return (
    <Card className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm">
      <CardContent>
        <h2 className="font-heading text-2xl font-semibold text-primary">
          Recent Activity
        </h2>

        <ul className="mt-6 space-y-5">
          {recentLogs.length > 0 ? (
            recentLogs.map(({ id, title, durationLabel, relativeLabel }) => (
              <li className="flex gap-3" key={id}>
                <div className="h-fit rounded-lg bg-[#f6f3f2] p-2 text-primary">
                  <UserRoundCheck className="size-4" />
                </div>
                <div>
                  <p className="text-sm text-primary">
                    You logged {durationLabel} on “{title}”
                  </p>
                  <p className="mt-1 text-xs text-[#6e746f]">
                    — {relativeLabel}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <li className="text-sm text-[#6e746f]">No recent time logs yet.</li>
          )}
        </ul>

        <Link
          href="/time-logs"
          className="mt-6 block w-full border-t border-primary/10 pt-3 text-center text-xs font-bold tracking-wider text-primary hover:text-secondary"
        >
          VIEW ALL LOGS
        </Link>
      </CardContent>
    </Card>
  );
};
