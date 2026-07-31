"use client";
import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTimer } from "@/context/TimerContext";
import { getTimeByStatus } from "@/lib/utils";

const chartConfig = {
  todo: {
    label: "To Do",
    color: "#0f3d2e",
  },
  in_progress: {
    label: "In Progress",
    color: "#d4b872",
  },
  done: {
    label: "Done",
    color: "#f5f1e8", // fixed: was incorrectly #d4b872
  },
} satisfies ChartConfig;

export function ReportPieChart({
  dateRange,
}: {
  dateRange: { from: Date; to: Date };
}) {
  const { tasks, timelogs } = useTimer();

  const { statusData, totalHours } = useMemo(
    () => getTimeByStatus(timelogs, tasks, dateRange.from, dateRange.to),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timelogs, tasks, dateRange.from, dateRange.to],
  );

  // Only non-zero slices are rendered in the donut; all three appear in the legend.
  const pieData = statusData.filter((entry) => entry.value > 0);

  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="text-lg font-bold text-[#0f3d2e]">
          Time by Status
        </CardTitle>
        <span className="size-5 rounded-full border-[3px] border-[#47857a] border-r-[#d3ad55]" />
      </CardHeader>

      <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-4">
        <div className="relative flex items-center justify-center">
          <ChartContainer
            config={chartConfig}
            className="aspect-square h-47.5 w-47.5"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="label"
                innerRadius={62}
                outerRadius={92}
                strokeWidth={0}
                startAngle={120}
                endAngle={-270}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#0f3d2e]">
              {totalHours}
            </span>
            <span className="text-[10px] font-semibold tracking-wide text-[#8b918d]">
              TOTAL
            </span>
          </div>
        </div>

        <div className="space-y-5">
          {statusData.map((entry) => (
            <div key={entry.status} className="flex items-start gap-2.5">
              <span
                className="mt-1.5 size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.fill }}
              />
              <div>
                <p className="text-sm font-bold text-[#0f3d2e]">
                  {entry.label}
                </p>
                <p className="text-sm text-[#7fa294]">
                  {entry.hours} ({entry.percent}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
