import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const weeklyHours = [5.2, 6.8, 4.4, 7.1, 5.8, 3.1, 1.8];
const entries = [
  ["Review Q3 Financial Disclosures", "Oct 28, 2023", "2h 15m"],
  ["Client Presentation Preparation", "Oct 27, 2023", "3h 45m"],
  ["Weekly Strategy Alignment", "Oct 26, 2023", "1h 00m"],
  ["Draft Executive Summary", "Oct 25, 2023", "4h 30m"],
];

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-semibold text-primary">
            Reports
          </h1>
          <p className="mt-1 text-sm text-[#47857a]">
            Your personal performance summary.
          </p>
        </div>
        <button className="flex h-9 items-center gap-2 self-start rounded-lg border border-primary/10 bg-white px-3 text-xs font-semibold text-primary shadow-sm md:self-auto">
          <CalendarDays className="size-3.5 text-[#47857a]" /> Oct 01 - Oct 31
          <ChevronDown className="w-4 h-4" />
        </button>
      </header>
      <section className="grid gap-5 md:grid-cols-3">
        <Stat
          icon={Clock3}
          label="Total Hours"
          value="38h 15m"
          sub="↗ +4.2h vs last month"
        />
        <Stat
          icon={CheckCircle2}
          label="Tasks Completed"
          value="12"
          sub="Across 4 projects"
        />
        <Stat
          icon={Clock3}
          label="Avg Session Length"
          value="1h 45m"
          sub="↗ +15m improvement"
        />
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-primary/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-primary">
              Time by Status
            </h2>
            <span className="size-5 rounded-full border-[3px] border-[#47857a] border-r-[#d3ad55]" />
          </div>
          <div className="mt-8 flex flex-col items-center justify-center gap-7 sm:flex-row">
            <div
              className="relative size-34 rounded-full"
              style={{
                background: "conic-gradient(#073d2d 0 75%, #d1ad56 75% 100%)",
              }}
            >
              <div className="absolute inset-3 rounded-full bg-white" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <strong className="font-heading text-lg text-primary">
                  38.2h
                </strong>
                <span className="text-[9px] font-bold text-[#47857a] uppercase">
                  Total
                </span>
              </div>
            </div>
            <div className="space-y-5 text-xs">
              <Legend
                color="bg-primary"
                label="Billable"
                value="28h 45m (75%)"
              />
              <Legend
                color="bg-[#d1ad56]"
                label="Non-Billable"
                value="9h 30m (25%)"
              />
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-primary/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-primary">
              Hours Logged Over Time
            </h2>
            <Sparkles className="size-5 text-[#47857a]" />
          </div>
          <div className="mt-7 flex h-38 items-end gap-5 border-b border-primary/10 px-4 sm:gap-8">
            {weeklyHours.map((value, index) => (
              <div className="flex h-full flex-1 items-end" key={index}>
                <div
                  className="w-full rounded-t-sm bg-[#0b3b2e]"
                  style={{ height: `${value * 13}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between px-4 text-[9px] font-bold text-[#47857a]">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </article>
      </section>
      <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white">
        <h2 className="px-5 py-5 font-heading text-xl font-semibold text-primary">
          Recent Time Log Entries
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left">
            <thead className="bg-[#faf9f7] text-[10px] font-bold tracking-[0.08em] text-[#47857a] uppercase">
              <tr>
                <th className="px-5 py-3">Task Name</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {entries.map(([name, date, duration]) => (
                <tr key={name}>
                  <td className="px-5 py-3.5 text-xs font-semibold text-primary">
                    {name}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#47857a]">{date}</td>
                  <td className="px-5 py-3.5 text-xs font-bold text-primary">
                    {duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <article className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-[0.08em] text-[#47857a] uppercase">
          {label}
        </p>
        <Icon className="size-5 text-[#ce9f38]" />
      </div>
      <p className="mt-3 font-heading text-3xl font-semibold text-primary">
        {value}
      </p>
      <p
        className={`mt-3 text-xs ${sub.startsWith("↗") ? "font-semibold text-green-700" : "text-[#47857a]"}`}
      >
        {sub}
      </p>
    </article>
  );
}
function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`size-3 rounded-full ${color}`} />
      <span>
        <strong className="block text-primary">{label}</strong>
        <span className="text-[10px] text-[#47857a]">{value}</span>
      </span>
    </div>
  );
}
