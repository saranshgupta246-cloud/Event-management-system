import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, CheckCircle, CalendarDays, Users } from "lucide-react";

const STATS = [
  { label: "Total Registrations", value: "1,284", change: "+12.5%", icon: TrendingUp },
  { label: "Attendance Rate", value: "85.2%", change: "+5.2%", icon: CheckCircle },
  { label: "Active Events", value: "12", change: "3 this week", icon: CalendarDays },
  { label: "Club Members", value: "156", change: "+8%", icon: Users },
];

export default function LeaderDashboard() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome back, Club Leader</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Your club activity is up 12% this week.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.change}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Quick links</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/leader/club" className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20">My Club</Link>
          <Link to="/leader/events" className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20">Events</Link>
          <Link to="/leader/participants" className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20">Participants</Link>
          <Link to="/leader/announcements" className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20">Announcements</Link>
        </div>
      </div>
    </div>
  );
}
