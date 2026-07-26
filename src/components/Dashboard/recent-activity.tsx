import { UserRoundCheck } from "lucide-react";
import { Card, CardContent } from "../ui/card";

const activity = [
  {
    icon: UserRoundCheck,
    label: "Task Completed:",
    detail: "Asset Icon Library",
    meta: "2 hours ago",
  },
];

export const RecentActivity = () => {
  return (
    <>
      <Card className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm">
        <CardContent>
          <h2 className="font-heading text-2xl font-semibold text-primary">
            Recent Activity
          </h2>
          <ul className="mt-6 space-y-5">
            {activity.map(({ icon: Icon, label, detail, meta }) => (
              <li className="flex gap-3" key={detail}>
                <div className="h-fit rounded-lg bg-[#f6f3f2] p-2 text-primary">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm">
                    <strong>{label}</strong> {detail}
                  </p>
                  <p className="mt-1 text-xs text-[#6e746f]">{meta}</p>
                </div>
              </li>
            ))}
          </ul>
          <button className="mt-6 w-full border-t border-primary/10 pt-3 text-xs font-bold tracking-wider text-primary hover:text-secondary">
            VIEW ALL LOGS
          </button>
        </CardContent>
      </Card>
    </>
  );
};
