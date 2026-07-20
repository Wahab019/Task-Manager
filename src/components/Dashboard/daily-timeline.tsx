import { ChevronLeft, ChevronRight } from "lucide-react";

import { ToolbarButton } from "@/components/Header";
import { Card, CardContent } from "../ui/card";

const timeline = [
  {
    time: "09:00 AM – 11:30 AM",
    title: "Morning Stand-up & Sprint Planning",
    duration: "2.5h",
    tone: "bg-primary",
  },
  {
    time: "11:45 AM – 01:15 PM",
    title: "UI Redesign: Fleet Management",
    duration: "1.5h",
    tone: "bg-secondary",
  },
  {
    time: "02:00 PM – 04:30 PM",
    title: "Internal System Architecture Audit",
    duration: "2.5h",
    tone: "bg-primary",
  },
  {
    time: "04:30 PM – NOW",
    title: "UI Redesign: Fleet Management (Session 2)",
    duration: "Active",
    tone: "bg-secondary",
    active: true,
  },
];

export const DailyTimeline = () => {
  return (
    <>
      <Card className="rounded-lg border border-primary/10 bg-white p-6 xl:col-span-7">
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-semibold text-primary">
              Daily Timeline
            </h2>
            <div className="flex items-center gap-2">
              <ToolbarButton label="Previous day">
                <ChevronLeft />
              </ToolbarButton>
              <span className="text-xs font-bold tracking-wider text-primary uppercase">
                Today, Oct 12
              </span>
              <ToolbarButton label="Next day">
                <ChevronRight />
              </ToolbarButton>
            </div>
          </div>
          <div className="ml-2 space-y-7 border-l border-primary/15 pl-8">
            {timeline.map((item) => (
              <div
                className="relative flex flex-col justify-between gap-2 sm:flex-row sm:items-center"
                key={item.title}
              >
                <span
                  className={`absolute -left-10.25 top-1 size-4 rounded-full border-4 border-white ring-1 ring-primary/20 ${item.tone} ${item.active ? "animate-pulse" : ""}`}
                />
                <div>
                  <p
                    className={`text-xs font-bold ${item.active ? "text-[#745b1b]" : "text-[#6e746f]"}`}
                  >
                    {item.time}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {item.title}
                  </p>
                </div>
                <span
                  className={`w-fit rounded px-2 py-1 text-xs font-semibold ${item.active ? "bg-[#ffdc8e] text-[#795f1f]" : "bg-[#eae7e7] text-primary"}`}
                >
                  {item.duration}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
