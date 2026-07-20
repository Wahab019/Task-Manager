import { MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "../ui/card";

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

export const TasksDue = () => {
  return (
    <>
      <Card className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm">
        <CardContent>
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
        </CardContent>
      </Card>
    </>
  );
};
