import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Pause, Square } from "lucide-react";

export function Avatar({ initials, tone }: { initials: string; tone: string }) {
  return (
    <span
      className={`flex size-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-primary ${tone}`}
    >
      {initials}
    </span>
  );
}
export const DashboardProgress = () => {
  return (
    <>
      <Card className="relative overflow-hidden rounded-lg border border-primary/10 bg-white p-5 shadow-sm lg:col-span-8">
        <CardContent>
          <div className="absolute inset-y-0 left-0 w-1 bg-secondary" />
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <span className="inline-flex rounded bg-[#ffdc8e] px-2 py-1 text-xs font-bold tracking-wide text-[#795f1f]">
                IN PROGRESS
              </span>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-primary">
                UI Redesign: Fleet Management Dashboard
              </h2>
              <p className="mt-1 text-sm text-[#6e746f]">
                Project: Aetheris Client Revamp
              </p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p className="font-mono text-3xl font-semibold tracking-wider text-primary">
                00:45:02
              </p>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-[#6e746f] uppercase">
                Session duration
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-primary/10 pt-5">
            <div className="flex -space-x-2">
              <Avatar initials="JD" tone="bg-[#bdedda]" />
              <Avatar initials="AM" tone="bg-[#ffdf9b]" />
            </div>
            <div className="flex gap-2">
              <Button variant="heritage-outline" size="sm">
                <Pause /> Pause
              </Button>
              <Button variant="heritage" size="sm">
                <Square className="size-3 fill-current" /> Stop timer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
