import {
  DashboardProgress,
  TotalHours,
  RecentActivity,
  DailyTimeline,
  TasksDue,
} from "@/components/Dashboard";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="grid gap-6 lg:grid-cols-12">
        <DashboardProgress />
        <TotalHours />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <DailyTimeline />

        <div className="space-y-6 xl:col-span-5">
          <RecentActivity />
          <TasksDue />
        </div>
      </section>
    </div>
  );
}
