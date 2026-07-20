import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Pencil,
} from "lucide-react";

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

export function DateRow({
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

export function LogRow({ log, muted }: { log: string[]; muted?: boolean }) {
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

export const LogTable = () => {
  return (
    <>
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
    </>
  );
};
