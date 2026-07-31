"use client";

import { Sparkles } from "lucide-react";
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
const items = [
  { label: "Select Week", value: null },
  { label: "Week 1", value: "week 1" },
  { label: "Week 2", value: "week 2" },
  { label: "Week 3", value: "week 3" },
  { label: "Week 4", value: "week 4" },
];

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

export function ReportBarChart({
  dateRange: _dateRange,
}: {
  dateRange: { from: Date; to: Date };
}) {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="font-heading text-xl font-bold text-[#0f3d2e]">
          Hours Logged Over Time
        </CardTitle>
        <CardAction>
          <Select items={items}>
            <SelectTrigger className="w-full max-w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Weeks</SelectLabel>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
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
