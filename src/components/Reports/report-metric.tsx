import { Clock3 } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export function ReportMetric({
  icon: Icon,
  label,
  value,
  selectedMonth,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  selectedMonth: Date;
}) {
  void selectedMonth;
  return (
    <>
      <Card className="rounded-2xl border-0 border-primary/10 bg-white p-5 shadow-sm print:hidden">
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

      <div className="hidden print:flex items-center gap-10 px-5">
        <p className="text-xs font-bold tracking-[0.08em] text-[#47857a] uppercase">
          {label}
        </p>
        <p className="font-heading text-xl font-semibold text-primary">
          {value}
        </p>
      </div>
    </>
  );
}
