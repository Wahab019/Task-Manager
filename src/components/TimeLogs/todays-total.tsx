import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const TodaysTotal = () => {
  return (
    <>
      <Card className="relative overflow-hidden rounded-lg border border-[#89671b] bg-white p-5 lg:col-span-4">
        <CardContent>
          <span className="absolute right-0 top-0 h-16 w-16 rounded-bl-2xl bg-[#e2e5e2]" />
          <span className="absolute right-5 top-5 size-6 rounded-full bg-[#d7dcda]" />
          <p className="text-[10px] font-bold tracking-[0.12em] text-[#795f1f] uppercase">
            Today&apos;s total
          </p>
          <p className="mt-2 font-heading text-4xl font-semibold text-primary">
            07:42<span className="ml-1 font-sans text-sm">hrs</span>
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="flex -space-x-2">
              <i className="flex size-5 items-center justify-center rounded-full bg-[#ffdf9b] text-[7px] not-italic">
                PR
              </i>
              <i className="flex size-5 items-center justify-center rounded-full bg-[#bdedda] text-[7px] not-italic">
                UX
              </i>
            </span>
            <span className="text-[10px] font-semibold text-primary">
              Across 2 projects
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
