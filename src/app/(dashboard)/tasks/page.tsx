import { ChevronDown } from "lucide-react";

import {
  TaskCard,
  TaskColumn,
  CompletedTask,
  OngoingTask,
} from "@/components/Tasks";
import { TaskBoard } from "@/components/Tasks/task-board";

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

      <TaskBoard />

      <section className="mt-9 grid gap-5 xl:grid-cols-3 xl:gap-8">
        {/* <TaskColumn
          title="To Do"
          tasks={tasks.filter((t) => t.status === "todo")}
          onAddTask={(draft) => {
            // call POST /api/tasks here, then update `tasks` state with the real
            // task returned from the server (including its real Appwrite id)
          }}
        />

        <TaskColumn
          title="In Progress"
          tasks={tasks.filter((t) => t.status === "in_progress")}
        />

        <TaskColumn
          title="Done"
          tasks={tasks.filter((t) => t.status === "done")}
        /> */}
      </section>
    </div>
  );
}
