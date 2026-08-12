"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimer } from "@/context/TimerContext";
import { getHoursByDayInRange, getWeeksInMonth } from "@/lib/utils";

const chartConfig = {
  hours: {
    label: "Hours",
    color: "#0f3d2e",
  },
} satisfies ChartConfig;

// Checks whether two dates fall within the same month and year.
function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// Defines the Report Bar Chart behavior used in this module.
export function ReportBarChart({ selectedMonth }: { selectedMonth: Date }) {
  const { timelogs } = useTimer();
  const weeks = useMemo(() => getWeeksInMonth(selectedMonth), [selectedMonth]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const isCurrentMonth = isSameMonth(selectedMonth, new Date());

  useEffect(() => {
    if (!isCurrentMonth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedWeekIndex(0);
      return;
    }

    const today = new Date();
    const matchingWeekIndex = weeks.findIndex(
      (week) => today >= week.from && today <= week.to,
    );
    setSelectedWeekIndex(matchingWeekIndex >= 0 ? matchingWeekIndex : 0);
  }, [isCurrentMonth, selectedMonth, weeks]);

  const selectedWeek = weeks[selectedWeekIndex] ?? weeks[0];

  const hoursData = useMemo(
    () => getHoursByDayInRange(timelogs, selectedWeek.from, selectedWeek.to),
    [timelogs, selectedWeek.from, selectedWeek.to],
  );

  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="font-heading text-xl font-bold text-[#0f3d2e]">
          Hours Logged Over Time
        </CardTitle>
        <CardAction>
          <Select
            value={String(selectedWeekIndex + 1)}
            onValueChange={(value) => setSelectedWeekIndex(Number(value) - 1)}
          >
            <SelectTrigger className="w-full max-w-48">
              Week <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Weeks</SelectLabel>
                {weeks.map((week, index) => (
                  <SelectItem key={week.label} value={String(index + 1)}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-6">
        <ChartContainer
          config={chartConfig}
          className="h-65 w-full print:h-auto print:min-h-[24rem]"
        >
          <BarChart
            data={hoursData}
            margin={{ left: -20, right: 8, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#efefec" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: "#e5e7e3" }}
              tick={{ fill: "#0f3d2e", fontSize: 11, fontWeight: 600 }}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#8b918d", fontSize: 11 }}
              tickFormatter={(value) => `${value}h`}
              domain={[0, "dataMax + 1"]}
              tickCount={5}
            />
            <ChartTooltip
              cursor={{ fill: "#f0f3f0" }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="hours"
              fill="#0f3d2e"
              radius={[4, 4, 0, 0]}
              maxBarSize={44}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
