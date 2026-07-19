import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreHorizontal,
  Pause,
  Square,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToolbarButton } from "@/components/Header";

export function Avatar({ initials, tone }: { initials: string; tone: string }) {
  return (
    <span
      className={`flex size-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-primary ${tone}`}
    >
      {initials}
    </span>
  );
}

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

const activity = [
  {
    icon: UserRoundCheck,
    label: "Task Completed:",
    detail: "Asset Icon Library",
    meta: "2 hours ago · Project Aetheris",
  },
];

const dueTasks = [
  {
    title: "User Testing Report",
    due: "Due in 2 hours",
    accent: "bg-destructive",
    dueClass: "text-destructive",
  },
  {
    title: "Final Asset Export",
    due: "Due Tomorrow",
    accent: "bg-secondary",
    dueClass: "text-[#6e746f]",
  },
  {
    title: "Weekly Sync Prep",
    due: "Due Friday",
    accent: "bg-[#a2d0be]",
    dueClass: "text-[#6e746f]",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="grid gap-6 lg:grid-cols-12">
        <article className="relative overflow-hidden rounded-lg border border-primary/10 bg-white p-6 shadow-sm lg:col-span-8">
          <div className="absolute inset-y-0 left-0 w-1 bg-secondary" />
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <span className="inline-flex rounded bg-[#ffdc8e] px-2 py-1 text-xs font-bold tracking-wide text-[#795f1f]">
                IN PROGRESS
              </span>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-primary">
                UI Redesign: Fleet Management Dashboard
              </h2>
              <p className="mt-1 text-sm text-[#6e746f]">
                Project: Aetheris Client Revamp
              </p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p className="font-mono text-3xl font-semibold tracking-wider text-primary">
                00:45:02
              </p>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-[#6e746f] uppercase">
                Session duration
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-primary/10 pt-5">
            <div className="flex -space-x-2">
              <Avatar initials="JD" tone="bg-[#bdedda]" />
              <Avatar initials="AM" tone="bg-[#ffdf9b]" />
            </div>
            <div className="flex gap-2">
              <Button variant="heritage-outline" size="sm">
                <Pause /> Pause
              </Button>
              <Button variant="heritage" size="sm">
                <Square className="size-3 fill-current" /> Stop timer
              </Button>
            </div>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-lg bg-primary p-6 text-white shadow-lg lg:col-span-4">
          <div className="flex items-center justify-between">
            <TrendingUp className="size-8 text-[#ffdf9b]" />
            <span className="rounded bg-white/10 px-2 py-1 text-xs font-semibold">
              THIS WEEK
            </span>
          </div>
          <p className="mt-8 text-sm text-white/75">Total Hours Worked</p>
          <p className="mt-1 font-heading text-5xl font-semibold text-[#ffdf9b]">
            38h 15m
          </p>
          <div className="mt-8 flex items-center gap-2 border-t border-white/15 pt-5 text-xs font-semibold text-[#ffdf9b]">
            <TrendingUp className="size-4" /> +4.2h from last week
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <article className="rounded-lg border border-primary/10 bg-white p-6 xl:col-span-7">
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
        </article>

        <div className="space-y-6 xl:col-span-5">
          <article className="rounded-lg border border-primary/10 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-2xl font-semibold text-primary">
              Recent Activity
            </h2>
            <ul className="mt-6 space-y-5">
              {activity.map(({ icon: Icon, label, detail, meta }) => (
                <li className="flex gap-3" key={detail}>
                  <div className="h-fit rounded-lg bg-[#f6f3f2] p-2 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <strong>{label}</strong> {detail}
                    </p>
                    <p className="mt-1 text-xs text-[#6e746f]">{meta}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button className="mt-6 w-full border-t border-primary/10 pt-3 text-xs font-bold tracking-wider text-primary hover:text-secondary">
              VIEW ALL LOGS
            </button>
          </article>
          <article className="rounded-lg border border-primary/10 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-2xl font-semibold text-primary">
              Tasks Due Soon
            </h2>
            <div className="mt-5 space-y-3">
              {dueTasks.map((task) => (
                <button
                  className="group flex w-full items-center justify-between rounded-lg border border-primary/10 bg-white p-3 text-left transition hover:border-secondary"
                  key={task.title}
                >
                  <span className="flex items-center gap-3">
                    <span className={`h-8 w-1 rounded-full ${task.accent}`} />
                    <span>
                      <span className="block text-sm font-semibold">
                        {task.title}
                      </span>
                      <span className={`mt-1 block text-xs ${task.dueClass}`}>
                        {task.due}
                      </span>
                    </span>
                  </span>
                  <MoreHorizontal className="size-4 text-[#6e746f] opacity-0 transition group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </article>
        </div>
      </section>
      <div className="pb-2 text-center text-xs text-[#6e746f]">
        <Clock3 className="mr-1 inline size-3" /> Dashboard data refreshed just
        now
      </div>
    </div>
  );
}
