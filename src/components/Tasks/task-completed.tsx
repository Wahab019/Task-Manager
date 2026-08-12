import { CheckCircle2, Clock3 } from "lucide-react";
import { Pill } from "./pill";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
// Renders a compact completed task summary.
// It shows title, description, and priority in the done column.
export function CompletedTask({
  title,
  description,
  time,
  completedAt,
}: {
  title: string;
  description: string;
  time: string;
  completedAt: string;
}) {
  const completedLabel = formatRelativeTime(completedAt);

  return (
    <Card className="rounded-lg border border-primary/10 bg-white p-5 opacity-55 max-w-100">
      <CardContent>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 fill-[#606560] text-white" />
          <Pill>Completed</Pill>
        </div>
        <h3 className="mt-4 font-heading text-xl font-semibold text-[#777b77] line-through">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-5 text-[#676c68]">{description}</p>
        {completedLabel && (
          <p className="mt-2 text-xs text-[#8a908c]">
            Completed {completedLabel}
          </p>
        )}
        <div className="mt-6 flex items-center justify-between text-xs text-[#8a908c]">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> {time}
          </span>
          <Clock3 className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}
