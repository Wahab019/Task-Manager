import { CheckCircle2, Clock3 } from "lucide-react";
import { Pill } from "./pill";
export function CompletedTask({
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
