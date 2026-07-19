import { Bell, Search, Settings, Timer } from "lucide-react";

export function ToolbarButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-primary transition hover:bg-[#eae7e7] [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

export const Header = () => {
  return (
    <>
      <header className="flex flex-col gap-4 border-b border-primary/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Good morning, Julian
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6e746f]" />
            <input
              className="h-9 w-60 rounded-lg border border-primary/20 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-secondary/30"
              placeholder="Search tasks…"
            />
          </label>
          <ToolbarButton label="Timer">
            <Timer />
          </ToolbarButton>
          <ToolbarButton label="Notifications">
            <Bell />
          </ToolbarButton>
          <ToolbarButton label="Settings">
            <Settings />
          </ToolbarButton>
          <div className="flex size-9 items-center justify-center rounded-full border-2 border-secondary/30 bg-primary text-xs font-bold text-white">
            JD
          </div>
        </div>
      </header>
    </>
  );
};
