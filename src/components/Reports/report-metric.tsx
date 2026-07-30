import { Clock3 } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export interface DateRange {
  from: Date;
  to: Date;
}

export function ReportMetric({
  icon: Icon,
  label,
  value,
  dateRange: _dateRange,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  dateRange: DateRange;
}) {
  return (
    <Card className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-[0.08em] text-[#47857a] uppercase">
            {label}
          </p>
          <Icon className="size-5 text-[#ce9f38]" />
        </div>
        <p className="mt-3 font-heading text-3xl font-semibold text-primary">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
