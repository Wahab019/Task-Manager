import { Pause, Square } from "lucide-react";

export const TimeTracker = () => {
  return (
    <>
      <aside className="fixed bottom-6 right-6 z-10 flex min-w-67 items-center gap-5 rounded-xl bg-[#003b2d] px-5 py-4 text-white shadow-[0_18px_40px_rgba(11,59,46,0.25)]">
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
      </aside>
    </>
  );
};
