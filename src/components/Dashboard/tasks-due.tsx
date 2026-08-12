import Link from "next/link";

import { Card, CardContent } from "../ui/card";

import { type Task } from "@/context/TimerContext";
import { formatDueLabel, getDueDateColor, getTasksDueSoon } from "@/lib/utils";

const colorClasses = {
  red: {
    accent: "bg-destructive",
    dueClass: "text-destructive",
  },
  yellow: {
    accent: "bg-secondary",
    dueClass: "text-[#795f1f]",
  },
  green: {
    accent: "bg-[#a2d0be]",
    dueClass: "text-[#6e746f]",
  },
} as const;

// Defines the Tasks Due behavior used in this module.
export const TasksDue = ({ tasks }: { tasks: Task[] }) => {
  const dueTasks = getTasksDueSoon(tasks).slice(0, 3);

  return (
    <Card className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm">
      <CardContent>
        <h2 className="font-heading text-2xl font-semibold text-primary">
          Tasks Due Soon
        </h2>
        <div className="mt-5 space-y-3">
          {dueTasks.length > 0 ? (
            dueTasks.map((task) => {
              const color = colorClasses[getDueDateColor(task.deadline ?? "")];

              return (
                <button
                  className="group flex w-full items-center justify-between rounded-lg border border-primary/10 bg-white p-3 text-left transition hover:border-secondary"
                  key={task.id}
                >
                  <span className="flex items-center gap-3">
                    <span className={`h-8 w-1 rounded-full ${color.accent}`} />
                    <span>
                      <span className="block text-sm font-semibold">
                        {task.title}
                      </span>
                      <span className={`mt-1 block text-xs ${color.dueClass}`}>
                        {formatDueLabel(task.deadline ?? "")}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-2 text-sm text-[#6e746f]">
              Nothing due right now.
            </p>
          )}
        </div>
        <Link
          href="/tasks"
          className="mt-6 block w-full border-t border-primary/10 pt-3 text-center text-xs font-bold tracking-wider text-primary hover:text-secondary"
        >
          VIEW ALL TASKS
        </Link>
      </CardContent>
    </Card>
  );
};
