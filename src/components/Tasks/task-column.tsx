export function TaskColumn({
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
