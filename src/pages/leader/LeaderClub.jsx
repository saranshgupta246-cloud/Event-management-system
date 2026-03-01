import React from "react";
import { Link } from "react-router-dom";
import { UsersRound, Calendar, Users, Pencil } from "lucide-react";

export default function LeaderClub() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UsersRound className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Code Chef MITS</h1>
              <p className="text-slate-500 dark:text-slate-400">Technical • 156 members</p>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Pencil className="h-4 w-4" />
            Edit Club
          </button>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          The official competitive programming and algorithm community for tech enthusiasts at MITS.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/leader/events"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center hover:bg-primary/5 hover:border-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-primary/10"
          >
            <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Events</span>
          </Link>
          <Link
            to="/leader/participants"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center hover:bg-primary/5 hover:border-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-primary/10"
          >
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Participants</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
