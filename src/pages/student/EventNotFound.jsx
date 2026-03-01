import React from "react";
import { Link } from "react-router-dom";

export default function EventNotFound() {
  return (
    <div className="p-6 sm:p-8 max-w-md mx-auto text-center">
      <div className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-800 p-10">
        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 block mb-4">
          event_busy
        </span>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Event not found</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          This event may have been removed or the link is incorrect.
        </p>
        <Link
          to="/student/events"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] font-semibold bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Events
        </Link>
      </div>
    </div>
  );
}
