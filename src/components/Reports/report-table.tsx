const entries = [
  ["Review Q3 Financial Disclosures", "Oct 28, 2023", "2h 15m"],
  ["Client Presentation Preparation", "Oct 27, 2023", "3h 45m"],
  ["Weekly Strategy Alignment", "Oct 26, 2023", "1h 00m"],
  ["Draft Executive Summary", "Oct 25, 2023", "4h 30m"],
];

export const ReportTable = () => {
  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white">
        <h2 className="px-5 py-5 font-heading text-xl font-semibold text-primary">
          Recent Time Log Entries
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
              {entries.map(([name, date, duration]) => (
                <tr key={name}>
                  <td className="px-5 py-3.5 text-xs font-semibold text-primary">
                    {name}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#47857a]">{date}</td>
                  <td className="px-5 py-3.5 text-xs font-bold text-primary">
                    {duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
