import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export const TotalHours = () => {
  return (
    <>
      <Card className="relative overflow-hidden rounded-lg bg-primary p-5 text-white shadow-lg lg:col-span-4">
        <CardContent>
          <div className="flex items-center justify-between">
            <TrendingUp className="size-8 text-[#ffdf9b]" />
            <span className="rounded bg-white/10 px-2 py-1 text-xs font-semibold">
              THIS WEEK
            </span>
          </div>
          <p className="mt-8 text-sm text-white/75">Total Hours Worked</p>
          <p className="mt-1 font-heading text-5xl font-semibold text-[#ffdf9b]">
            38h 15m
          </p>
          <div className="mt-8 flex items-center gap-2 border-t border-white/15 pt-5 text-xs font-semibold text-[#ffdf9b]">
            <TrendingUp className="size-4" /> +4.2h from last week
          </div>
        </CardContent>
      </Card>
    </>
  );
};
