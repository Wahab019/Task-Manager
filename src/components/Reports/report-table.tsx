"use client";

import { useMemo } from "react";

import { useTimer } from "@/context/TimerContext";
import { getRecentCompletedTasksInMonth } from "@/lib/utils";

export const ReportTable = ({ selectedMonth }: { selectedMonth: Date }) => {
  const { tasks } = useTimer();

  const entries = useMemo(
    () => getRecentCompletedTasksInMonth(tasks, selectedMonth),
    [tasks, selectedMonth],
  );

  return (
    <>
      <section className="overflow-hidden rounded-2xl border print:border-0 border-primary/10 bg-white">
        <h2 className="px-5 py-5 font-heading text-xl font-semibold text-primary">
          Recent Completed Tasks
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left">
            <thead className="bg-[#faf9f7] text-[10px] font-bold tracking-[0.08em] text-[#47857a] uppercase">
              <tr>
                <th className="px-5 py-3">Task Name</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-5 py-3.5 text-xs font-semibold text-primary">
                      {entry.taskName}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#47857a]">
                      {entry.date}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-primary">
                      {entry.duration}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-5 py-8 text-center text-sm text-[#6e746f]"
                    colSpan={3}
                  >
                    No tasks completed this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
