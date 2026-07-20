import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const WeeklyProgress = () => {
  return (
    <>
      <Card className="rounded-lg border border-primary/10 bg-white p-5 lg:col-span-8">
        <CardContent>
          <div className="flex justify-between">
            <p className="text-[10px] font-bold tracking-[0.12em] text-primary uppercase">
              Weekly progress
            </p>
            <span className="bg-[#f0f3f0] px-2 py-1 text-[10px] font-bold text-primary">
              Target: 40h
            </span>
          </div>
          <p className="mt-2 font-heading text-4xl font-semibold text-primary">
            32:15<span className="ml-1 font-sans text-sm">/ 40:00</span>
          </p>
          <div className="mt-6 h-2 bg-[#eae7e7]">
            <div className="h-full w-[80%] bg-primary" />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-semibold">
            <span className="text-primary">80% of weekly goal</span>
            <span className="text-[#795f1f]">+2h today</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
