import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  Download,
  Pencil,
  Users,
  MessageCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

const EVENTS = [
  { id: 1, title: "Annual Tech Symposium 2024", venue: "Engineering Block • Main Hall", date: "Oct 15, 2024", time: "10:00 AM - 04:00 PM", status: "Published", reg: { current: 158, max: 200 }, pct: 79 },
  { id: 2, title: "Inter-College Debate Finals", venue: "Arts Auditorium", date: "Nov 02, 2024", time: "02:00 PM - 05:00 PM", status: "Draft", reg: { current: 0, max: 50 }, pct: 0 },
  { id: 3, title: "Winter Music Fest '24", venue: "Open Air Theater", date: "Dec 20, 2024", time: "06:00 PM - 11:00 PM", status: "Published", reg: { current: 420, max: 500 }, pct: 84 },
  { id: 4, title: "Alumni Meetup 2024", venue: "Main Dining Hall", date: "Aug 10, 2024", time: "11:00 AM - 03:00 PM", status: "Completed", reg: { current: 120, max: 120 }, pct: 100 },
];

const FILTERS = ["All Events", "Published", "Drafts", "Completed", "Archived"];

export default function OrganizerEventList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Events");
  const [page, setPage] = useState(1);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <div className="layout-container flex h-full grow flex-col">
        <main className="flex flex-1 justify-center px-10 py-8">
          <div className="layout-content-container flex max-w-[1280px] flex-1 flex-col">
            <div className="mb-6 flex items-end justify-between">
              <div className="px-4">
                <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                  Event Management
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Manage and track your college campus events from one dashboard.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <Filter className="h-5 w-5" />
                  Filter
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <Download className="h-5 w-5" />
                  Export
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-8 flex flex-wrap gap-4 px-4">
              {[
                { label: "Total Events", value: "24", sub: "+3 this month", iconBg: "bg-primary/10 text-primary", Icon: Calendar },
                { label: "Registrations", value: "1,240", sub: "+12% vs last week", iconBg: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400", Icon: Users },
                { label: "Pending Certificates", value: "85", sub: "Priority", iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400", Icon: Award },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg p-2 ${s.iconBg}`}>
                      <s.Icon className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                    <span className="text-sm font-semibold text-green-600">{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-3 overflow-x-auto px-4 pb-4">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`flex h-9 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-5 transition-colors ${
                    filter === f
                      ? "bg-primary text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <p className="text-sm font-medium">{f}</p>
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Event Details</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date & Time</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Registrations</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {EVENTS.map((ev) => (
                    <tr key={ev.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-lg border border-slate-200 bg-slate-100 bg-cover bg-center dark:border-slate-700" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{ev.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{ev.venue}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{ev.date}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{ev.time}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            ev.status === "Published"
                              ? "bg-primary/10 text-primary"
                              : ev.status === "Completed"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex min-w-[120px] flex-col gap-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span>{ev.reg.current} / {ev.reg.max}</span>
                            <span className={ev.pct > 0 ? "text-primary" : "text-slate-400"}>{ev.pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full ${ev.status === "Completed" ? "bg-green-500" : "bg-primary"}`}
                              style={{ width: `${ev.pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-700" title="Edit Event">
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-700" title="Participants">
                            <Users className="h-5 w-5" />
                          </button>
                          <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-700" title="Access Chat">
                            <MessageCircle className="h-5 w-5" />
                          </button>
                          {ev.status === "Completed" ? (
                            <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-primary/90" title="Certificates">
                              <Award className="h-4 w-4" />
                              Issue
                            </button>
                          ) : (
                            <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-700" title="Certificates">
                              <Award className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">Showing 1-4 of 24 events</p>
                <div className="flex items-center gap-1">
                  <button type="button" className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button type="button" className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">1</button>
                  <button type="button" className="flex size-9 items-center justify-center rounded-lg border border-transparent text-sm font-medium text-slate-600 transition-all hover:border-slate-200 dark:text-slate-300 dark:hover:border-slate-700">2</button>
                  <button type="button" className="flex size-9 items-center justify-center rounded-lg border border-transparent text-sm font-medium text-slate-600 transition-all hover:border-slate-200 dark:text-slate-300 dark:hover:border-slate-700">3</button>
                  <span className="px-1 text-slate-400">...</span>
                  <button type="button" className="flex size-9 items-center justify-center rounded-lg border border-transparent text-sm font-medium text-slate-600 transition-all hover:border-slate-200 dark:text-slate-300 dark:hover:border-slate-700">6</button>
                  <button type="button" className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer className="border-t border-slate-200 py-6 px-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <p>© 2024 CampusEvent Pro. All Rights Reserved. Designed for College Administrators.</p>
        </footer>
      </div>
    </div>
  );
}
