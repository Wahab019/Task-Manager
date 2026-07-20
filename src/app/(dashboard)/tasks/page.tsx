import { CirclePlus, ChevronDown } from "lucide-react";

import {
  TaskCard,
  TaskColumn,
  CompletedTask,
  OngoingTask,
} from "@/components/Tasks";

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
            action="Start"
          />
          <TaskCard
            priority="Low Priority"
            title="Update Design Tokens"
            description="Export the latest color palette from Figma to the style guide manifest."
            action="Start"
          />
        </TaskColumn>

        <TaskColumn title="In Progress" count="03">
          <OngoingTask />
          <TaskCard
            priority="Normal"
            title="Client Onboarding Flow"
            description="Integrating the automated email sequence for the initial 7 days."
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
    </div>
  );
}
