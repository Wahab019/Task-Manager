"use client";

import { Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const hoursData = [
  { day: "MON", hours: 5.5 },
  { day: "TUE", hours: 7.5 },
  { day: "WED", hours: 4.5 },
  { day: "THU", hours: 8 },
  { day: "FRI", hours: 6.5 },
  { day: "SAT", hours: 3 },
  { day: "SUN", hours: 2 },
];

const chartConfig = {
  hours: {
    label: "Hours",
    color: "#0f3d2e",
  },
} satisfies ChartConfig;

export function ReportBarChart() {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="font-heading text-xl font-bold text-[#0f3d2e]">
          Hours Logged Over Time
        </CardTitle>
        <Sparkles className="size-5 text-[#7fa294]" strokeWidth={2} />
      </CardHeader>

      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="h-65 w-full">
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
