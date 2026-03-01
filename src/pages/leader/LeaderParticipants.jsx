import React from "react";

const ROWS = [
  { name: "Jane Doe", email: "jane.doe@college.edu", event: "Hackathon 2024", status: "Confirmed" },
  { name: "Marcus Smith", email: "m.smith@college.edu", event: "Design Workshop", status: "Pending" },
];

export default function LeaderParticipants() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Participants</h2>
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Participant</th>
              <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Event</th>
              <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {ROWS.map((row) => (
              <tr key={row.email}>
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{row.email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{row.event}</td>
                <td className="px-6 py-4">
                  <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (row.status === "Confirmed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
