import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Play,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const todayLogs = [
  [
    "User Interview Analysis - Phase 2",
    "Synthesizing findings from internal stakeholder group.",
    "Aetheris Redesign",
    "09:15 AM - 12:30 PM",
    "03:15",
    "bg-[#886719]",
  ],
  [
    "Weekly Sync & Strategy Session",
    "Q4 planning and resource allocation.",
    "Internal Ops",
    "01:30 PM - 03:00 PM",
    "01:30",
    "bg-primary",
  ],
  [
    "High-Fidelity Prototyping",
    "Interactive components for the tracking module.",
    "Aetheris Redesign",
    "03:15 PM - 06:12 PM",
    "02:57",
    "bg-[#886719]",
  ],
];

export default function TimeLogsPage() {
  return (
    <div className="relative pb-20 mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-5 border-b border-primary/10 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold text-primary">
            Workspace <span className="mx-2 text-[#9a9e9b]">›</span> Time Logs
          </p>
          <h1 className="mt-2 font-heading text-4xl font-semibold text-primary">
            Daily &amp; Weekly Logs
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-primary">
            Monitor productivity across projects with high-precision time
            tracking and editorial-grade reporting.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="heritage-outline" size="lg">
            <Download /> Export Report
          </Button>
          <Button variant="heritage" size="lg">
            <span className="text-lg leading-none">+</span> Add Time Entry
          </Button>
        </div>
      </header>
      <section className="mt-10 grid gap-5 lg:grid-cols-12">
        <article className="relative overflow-hidden rounded-lg border border-[#89671b] bg-white p-6 lg:col-span-4">
          <span className="absolute right-0 top-0 h-16 w-16 rounded-bl-2xl bg-[#e2e5e2]" />
          <span className="absolute right-5 top-5 size-6 rounded-full bg-[#d7dcda]" />
          <p className="text-[10px] font-bold tracking-[0.12em] text-[#795f1f] uppercase">
            Today&apos;s total
          </p>
          <p className="mt-2 font-heading text-4xl font-semibold text-primary">
            07:42<span className="ml-1 font-sans text-sm">hrs</span>
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="flex -space-x-2">
              <i className="flex size-5 items-center justify-center rounded-full bg-[#ffdf9b] text-[7px] not-italic">
                PR
              </i>
              <i className="flex size-5 items-center justify-center rounded-full bg-[#bdedda] text-[7px] not-italic">
                UX
              </i>
            </span>
            <span className="text-[10px] font-semibold text-primary">
              Across 2 projects
            </span>
          </div>
        </article>
        <article className="rounded-lg border border-primary/10 bg-white p-6 lg:col-span-5">
          <div className="flex justify-between">
            <p className="text-[10px] font-bold tracking-[0.12em] text-primary uppercase">
              Weekly progress
            </p>
            <span className="bg-[#f0f3f0] px-2 py-1 text-[10px] font-bold text-primary">
              Target: 40h
            </span>
          </div>
          <p className="mt-2 font-heading text-4xl font-semibold text-primary">
            32:15<span className="ml-1 font-sans text-sm">/ 40:00</span>
          </p>
          <div className="mt-6 h-2 bg-[#eae7e7]">
            <div className="h-full w-[80%] bg-primary" />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-semibold">
            <span className="text-primary">80% of weekly goal</span>
            <span className="text-[#795f1f]">+2h today</span>
          </div>
        </article>
        <article className="flex flex-col items-center justify-center rounded-lg border border-primary/10 bg-white p-6 text-center lg:col-span-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#866719] text-white">
            <Star className="size-4 fill-current" />
          </span>
          <h2 className="mt-3 font-heading text-xl font-semibold text-primary">
            Peak Focus
          </h2>
          <p className="mt-1 max-w-45 text-xs leading-4 text-primary">
            Tuesday mornings, avg. 3.5h uninterrupted work.
          </p>
        </article>
      </section>
      <section className="mt-10 overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-primary/10 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex w-fit items-center rounded-xl bg-[#f7f6f4] px-3 py-1">
            <button aria-label="Previous week" className="p-2 text-primary">
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-42 text-center text-xs font-bold text-primary">
              Oct 21 - Oct 27, 2024
            </span>
            <button aria-label="Next week" className="p-2 text-primary">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
              <input
                className="h-9 w-55 rounded-xl border border-primary/10 bg-[#faf9f7] pl-9 pr-3 text-xs outline-none focus:border-primary"
                placeholder="Search tasks..."
              />
            </label>
            <button
              aria-label="Filter logs"
              className="flex size-9 items-center justify-center rounded-xl border border-primary/10"
            >
              <SlidersHorizontal className="size-4 text-primary" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left">
            <thead className="border-b border-primary/10 bg-[#faf9f7] text-[10px] font-bold tracking-widest text-primary uppercase">
              <tr>
                <th className="px-5 py-4">Date / Task name</th>
                <th className="px-4 py-4">Project</th>
                <th className="px-4 py-4">Start - End</th>
                <th className="px-4 py-4">Duration</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <DateRow label="Today, Monday Oct 21" total="07:42" current />
              {todayLogs.map((log) => (
                <LogRow key={log[0]} log={log} />
              ))}
              <DateRow label="Sunday, Oct 20" total="00:00" />
              <DateRow label="Saturday, Oct 19" total="04:20" />
              <LogRow
                muted
                log={[
                  "Cloud Infrastructure Review",
                  "Emergency scaling documentation.",
                  "Internal Ops",
                  "10:00 AM - 02:20 PM",
                  "04:20",
                  "bg-[#557b70]",
                ]}
              />
            </tbody>
          </table>
        </div>
        <footer className="bg-[#faf9f7] px-5 py-6 text-[10px] text-primary">
          Showing logs for the selected week. All times are in GMT+1.
        </footer>
      </section>
    </div>
  );
}

function DateRow({
  label,
  total,
  current,
}: {
  label: string;
  total: string;
  current?: boolean;
}) {
  return (
    <tr className="border-b border-primary/10 bg-[#f5f3f1]">
      <td className="px-5 py-3 text-xs font-semibold text-primary" colSpan={4}>
        {label}{" "}
        {current && (
          <span className="ml-2 bg-[#ffdf9b] px-1.5 py-1 text-[8px] font-bold text-[#795f1f] uppercase">
            Current day
          </span>
        )}
      </td>
      <td className="px-5 py-3 text-right text-xs font-bold text-primary">
        Total: {total}
      </td>
    </tr>
  );
}

function LogRow({ log, muted }: { log: string[]; muted?: boolean }) {
  const [title, description, project, hours, duration, color] = log;
  return (
    <tr className={`border-b border-primary/5 ${muted ? "opacity-60" : ""}`}>
      <td className="px-5 py-4">
        <div className="flex gap-3">
          <span className={`mt-1 h-5 w-1 rounded-full ${color}`} />
          <span>
            <strong className="block text-xs tracking-wide text-primary">
              {title}
            </strong>
            <span className="block text-[10px] text-primary">
              {description}
            </span>
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="rounded-full border border-primary/10 bg-[#f5f5f2] px-3 py-1 text-[10px] text-primary">
          {project}
        </span>
      </td>
      <td className="px-4 py-4 text-xs text-primary">{hours}</td>
      <td className="px-4 py-4 text-xs font-bold text-primary">{duration}</td>
      <td className="px-5 py-4 text-right">
        <button aria-label={`Edit ${title}`}>
          <Pencil className="size-4 text-primary" />
        </button>
      </td>
    </tr>
  );
}
