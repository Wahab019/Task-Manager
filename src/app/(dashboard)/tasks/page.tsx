import {
  CheckCircle2,
  CirclePlus,
  Clock3,
  Ellipsis,
  Pause,
  Play,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function TasksPage() {
  return (
    <div className="relative mx-auto min-h-[calc(100vh-4rem)] max-w-7xl">
      <header className="flex flex-col gap-5 pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-primary">
            Workspace <span className="mx-2 text-[#9a9e9b]">/</span> Active
            Tasks
          </p>
          <h1 className="mt-1 font-heading text-4xl font-semibold tracking-tight text-primary">
            Strategic Task Flow
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex rounded bg-[#eae9e8] p-1 text-xs font-semibold text-primary">
            <button className="rounded bg-white px-4 py-2 shadow-sm">
              List
            </button>
            <button className="rounded px-4 py-2 text-[#6e746f] hover:text-primary">
              Board
            </button>
          </div>
          <button className="flex h-9 min-w-42 items-center justify-between rounded-sm border border-primary/15 bg-white px-4 text-xs font-semibold text-primary">
            All Projects <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </header>

      <section className="mt-9 grid gap-5 xl:grid-cols-3 xl:gap-8">
        <TaskColumn
          title="To Do"
          count="08"
          action={<CirclePlus className="size-5" />}
        >
          <TaskCard
            priority="High Priority"
            title="Refine Typography Scale"
            description="Ensure the Hanken Grotesk and Source Serif 4 pairing works perfectly across all templates."
            time="2h / 0h"
            action="Start"
          />
          <TaskCard
            priority="Low Priority"
            title="Update Design Tokens"
            description="Export the latest color palette from Figma to the style guide manifest."
            time="45m / 0h"
            action="Start"
          />
        </TaskColumn>

        <TaskColumn title="In Progress" count="03">
          <article className="relative overflow-hidden rounded-lg border border-[#9f7a2c] bg-white p-5 shadow-[0_8px_18px_rgba(11,59,46,0.09)]">
            <span className="absolute right-0 top-0 flex size-13 items-start justify-end rounded-bl-[22px] bg-[#e6e2d9] p-3">
              <span className="size-3 rounded-full bg-[#795f1f]" />
            </span>
            <Pill>In Progress</Pill>
            <h2 className="mt-5 font-heading text-xl font-semibold text-primary">
              Interface Audit: Kanban
            </h2>
            <p className="mt-1 max-w-72 text-sm leading-5 text-primary">
              Reviewing accessibility and micro-interactions on the new board
              view.
            </p>
            <div className="mt-6 flex items-center justify-between rounded bg-[#f5f3f1] px-3 py-3">
              <span className="font-mono text-lg font-bold text-[#795f1f]">
                01:48:35
              </span>
              <span className="text-right text-[9px] leading-3 tracking-wide text-[#6e746f] uppercase">
                Est. time
                <br />
                <b className="text-xs text-primary">03:00:00</b>
              </span>
            </div>
            <Button className="mt-5 w-full" variant="heritage" size="lg">
              <Pause className="fill-current" /> Stop Timer
            </Button>
          </article>
          <TaskCard
            priority="Normal"
            title="Client Onboarding Flow"
            description="Integrating the automated email sequence for the initial 7 days."
            time="5h / 1.5h"
            action="Resume"
          />
        </TaskColumn>

        <TaskColumn title="Done" count="12">
          <CompletedTask
            title="Wireframe User Journey"
            description="Completed mapping the end-to-end checkout experience for mobile."
            time="Time Spent: 6.2h"
          />
          <CompletedTask
            title="Logo Refresh Concepts"
            description="Finalizing the three chosen concepts for stakeholder review."
            time="Time Spent: 12h"
          />
        </TaskColumn>
      </section>

      {/* <aside className="fixed bottom-6 right-6 z-10 flex min-w-67 items-center gap-5 rounded-xl bg-[#003b2d] px-5 py-4 text-white shadow-[0_18px_40px_rgba(11,59,46,0.25)]">
        <div>
          <p className="text-[9px] tracking-[0.12em] text-[#a2d0be] uppercase">
            Currently tracking
          </p>
          <p className="mt-1 font-mono text-lg font-bold">01:48:35</p>
        </div>
        <span className="h-8 w-px bg-white/15" />
        <button
          aria-label="Pause timer"
          className="flex size-9 items-center justify-center rounded-lg bg-[#866719] text-white"
        >
          <Pause className="size-4 fill-current" />
        </button>
        <button
          aria-label="Stop timer"
          className="flex size-9 items-center justify-center rounded-lg bg-[#cf2525] text-white"
        >
          <Square className="size-3 fill-current" />
        </button>
      </aside> */}
    </div>
  );
}

function TaskColumn({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold tracking-[0.08em] text-[#747974] uppercase">
            {title}
          </h2>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${title === "In Progress" ? "bg-[#ffdf9b] text-[#795f1f]" : title === "Done" ? "bg-[#bdedda] text-primary" : "bg-[#ecebea] text-[#646964]"}`}
          >
            {count}
          </span>
        </div>
        {action && (
          <button
            aria-label="Add task"
            className="text-primary hover:text-secondary"
          >
            {action}
          </button>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function TaskCard({
  priority,
  title,
  description,
  time,
  action,
}: {
  priority: string;
  title: string;
  description: string;
  time: string;
  action: string;
}) {
  return (
    <article className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <Pill>{priority}</Pill>
        <button aria-label={`Options for ${title}`} className="text-[#aeb2ad]">
          <Ellipsis className="size-5" />
        </button>
      </div>
      <h3 className="mt-5 font-heading text-xl font-semibold text-primary">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-5 text-primary">{description}</p>
      <div className="mt-6 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs text-[#8a908c]">
          <Clock3 className="size-3.5" /> {time}
        </span>
        <Button variant="heritage-gold" size="sm">
          <Play className="size-3 fill-current" /> {action}
        </Button>
      </div>
    </article>
  );
}

function CompletedTask({
  title,
  description,
  time,
}: {
  title: string;
  description: string;
  time: string;
}) {
  return (
    <article className="rounded-lg border border-primary/10 bg-white p-5 opacity-55">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 fill-[#606560] text-white" />
        <Pill>Completed</Pill>
      </div>
      <h3 className="mt-4 font-heading text-xl font-semibold text-[#777b77] line-through">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-5 text-[#676c68]">{description}</p>
      <div className="mt-6 flex items-center justify-between text-xs text-[#8a908c]">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="size-3.5" /> {time}
        </span>
        <Clock3 className="size-4" />
      </div>
    </article>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex bg-[#f0f0ee] px-2 py-1 text-[9px] font-bold tracking-wide text-primary uppercase">
      {children}
    </span>
  );
}
