import React from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Calendar, Users, Megaphone, Award, Settings, PlusCircle, Search, Bell } from "lucide-react";

// NOTE:
// This admin-facing dashboard is now a simple shell that links into the real
// club leader experience. All previous hard-coded stats and demo participants
// have been removed to avoid confusing, fake data.

export default function ClubLeaderDashboard() {
  return (
    <div className="flex min-h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
              <h1 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">Club Leader Portal</h1>
            <p className="text-xs font-normal text-slate-500">Shortcuts for leaders</p>
          </div>
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-4">
          <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </div>
          <Link
            to="/leader/events"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Calendar className="h-5 w-5" />
            Events
          </Link>
          <Link
            to="/leader/participants"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Users className="h-5 w-5" />
            Participants
          </Link>
          <Link
            to="/leader/announcements"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Megaphone className="h-5 w-5" />
            Announcements
          </Link>
          <Link
            to="/leader/certificates"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Award className="h-5 w-5" />
            Certificates
          </Link>
          <div className="border-t border-slate-200 py-2 pt-4 dark:border-slate-800">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Settings</p>
            <Link
              to="/leader"
              className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Settings className="h-5 w-5" />
              Preferences
            </Link>
          </div>
        </nav>
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <Link
              to="/leader/events"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90"
            >
              <PlusCircle className="h-[18px] w-[18px]" />
              Go to Leader Events
            </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search within leader tools… (coming soon)"
              className="w-full rounded-lg border-none bg-slate-100 py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 size-2 rounded-full border-2 border-white bg-red-500 dark:border-slate-900" />
            </button>
              <div className="mx-2 h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex cursor-default items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">Alex Rivera</p>
                <p className="mt-1 text-[10px] font-medium text-slate-500">Tech Club Leader</p>
              </div>
              <div className="size-10 rounded-full border border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-700" />
            </div>
          </div>
        </header>

        <div className="w-full max-w-7xl mx-auto p-8">
          <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Welcome back, Club Leader
              </h2>
              <p className="text-base font-normal text-slate-500">
                Use these shortcuts to jump into the live leader tools powered by real data.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/leader"
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-primary/40 hover:bg-primary/5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Leader Dashboard
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                View live stats and quick links for your club.
              </p>
            </Link>
            <Link
              to="/leader/club"
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-primary/40 hover:bg-primary/5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                My Club
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage your club details and see real member counts.
              </p>
            </Link>
            <Link
              to="/leader/participants"
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-primary/40 hover:bg-primary/5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Participants
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Review real participants for your events.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
