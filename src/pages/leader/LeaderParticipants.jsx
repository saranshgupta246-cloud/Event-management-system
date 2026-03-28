import React from "react";

export default function LeaderParticipants() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
        Participants
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        This page will soon display real participants for your club events. There is no
        demo data here so that numbers stay accurate.
      </p>
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-[#1e2d42] dark:bg-[#161f2e]/40 dark:text-slate-400">
        No participants to show yet.
      </div>
    </div>
  );
}
