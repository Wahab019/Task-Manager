import { Pill } from "./pill";
import { Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export const OngoingTask = () => {
  return (
    <>
      <Card className="relative overflow-hidden rounded-lg border border-[#9f7a2c] bg-white p-5 shadow-[0_8px_18px_rgba(11,59,46,0.09)]">
        <CardContent>
          <span className="absolute right-0 top-0 flex size-13 items-center justify-center rounded-bl-[22px] p-3">
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#795f1f] opacity-75"></span>
              <span className="relative inline-flex size-3 rounded-full bg-[#795f1f]"></span>
            </span>
          </span>
          <Pill>In Progress</Pill>
          <h2 className="mt-5 font-heading text-xl font-semibold text-primary">
            Interface Audit: Kanban
          </h2>
          <p className="mt-1 max-w-72 text-sm leading-5 text-primary">
            Reviewing accessibility and micro-interactions on the new board
            view.
          </p>
          <div className="mt-6 flex items-center justify-between rounded bg-[#f5f3f1] px-3 py-3">
            <span className="font-mono text-lg font-bold text-[#795f1f]">
              01:48:35
            </span>
            <span className="text-right text-[9px] leading-3 tracking-wide text-[#6e746f] uppercase">
              Est. time
              <br />
              <b className="text-xs text-primary">03:00:00</b>
            </span>
          </div>
          <Button className="mt-5 w-full" variant="heritage" size="lg">
            <Pause className="fill-current" /> Stop Timer
          </Button>
        </CardContent>
      </Card>
    </>
  );
};
