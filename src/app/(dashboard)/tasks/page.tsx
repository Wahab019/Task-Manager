import { TaskBoard } from "@/components/Tasks/task-board";

export default function TasksPage() {
  return (
    <div className="relative mx-auto min-h-[calc(100vh-4rem)] max-w-7xl">
      <header className="flex flex-col gap-5 pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mt-1 font-heading text-4xl font-semibold tracking-tight text-primary">
            Strategic Task Flow
          </h1>
        </div>
      </header>

      <TaskBoard />
    </div>
  );
}
