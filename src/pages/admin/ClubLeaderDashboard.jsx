import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Megaphone,
  Award,
  Settings,
  PlusCircle,
  Search,
  Bell,
  Share2,
  Download,
  MoreVertical,
  TrendingUp,
  CheckCircle,
  CalendarDays,
  Upload,
  Sparkles,
  ImageIcon,
} from "lucide-react";

const PARTICIPANTS = [
  { name: "Jane Doe", email: "jane.doe@college.edu", event: "Hackathon 2024", status: "Confirmed" },
  { name: "Marcus Smith", email: "m.smith@college.edu", event: "Design Workshop", status: "Pending" },
  { name: "Sarah Chen", email: "schen@college.edu", event: "Hackathon 2024", status: "Confirmed" },
];

const MILESTONES = [
  { title: "Speaker Confirmation", sub: "Tech Talk: AI Ethics (Tomorrow, 10:00 AM)", active: true },
  { title: "Registration Deadline", sub: "Design Sprint (Oct 24, 11:59 PM)", active: false },
  { title: "Final Event Launch", sub: "Winter Coding Gala (Oct 30)", active: false },
];

export default function ClubLeaderDashboard() {
  const [announcementSubject, setAnnouncementSubject] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");

  return (
    <div className="flex min-h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">Club Portal</h1>
            <p className="text-xs font-normal text-slate-500">Campus Management</p>
          </div>
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-4">
          <Link
            to="/admin/club-leader"
            className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary"
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
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
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90"
          >
            <PlusCircle className="h-[18px] w-[18px]" />
            Create New Event
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search events, participants, or tools..."
              className="w-full rounded-lg border-none bg-slate-100 py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 size-2 rounded-full border-2 border-white bg-red-500 dark:border-slate-900" />
            </button>
            <div className="mx-2 h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex cursor-pointer items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">Alex Rivera</p>
                <p className="mt-1 text-[10px] font-medium text-slate-500">Tech Club Leader</p>
              </div>
              <div
                className="size-10 rounded-full border border-slate-300 bg-cover bg-center dark:border-slate-700"
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAtrglL9NNnOyNJ8xSWQi2ul7xejkCkPYN_VROGFtw7ZChmqjtxrAyyFA2buSiOIjZ55E0ouMccGgy4oHjSZOKSbxlqG1vXW-Fp-0Qx5XBSIZCaAEKSC_2gtotG5UqnLuMuPcd_Xn2c2rYfi8dlZjSdyVP_Rd8jMo_s-or7ALstCafNbj58ifoZwMr12K-XrVY53-RkfmDAJYuf0JQ4K-XIEHKZwP7_Q-CKoSKQLs7I-D-Z8faD4N8kHVab00eNr7gUvfvT7UMFcOzF')" }}
                role="img"
                aria-label="Profile"
              />
            </div>
          </div>
        </header>

        <div className="w-full max-w-7xl mx-auto p-8">
          <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Welcome back, Club Leader</h2>
              <p className="text-base font-normal text-slate-500">Your club's activity is up 12% this week. Here's what's happening.</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Share2 className="h-[18px] w-[18px]" />
                Export Stats
              </button>
              <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-primary/90">
                New Announcement
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Registrations", value: "1,284", change: "+12.5% vs last month", icon: TrendingUp, iconClass: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400", changeClass: "text-green-600 dark:text-green-400" },
              { label: "Attendance Rate", value: "85.2%", change: "+5.2% vs average", icon: CheckCircle, iconClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", changeClass: "text-blue-600 dark:text-blue-400" },
              { label: "Active Events", value: "12", change: "3 events starting this week", icon: CalendarDays, iconClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400", changeClass: "text-slate-400" },
              { label: "Club Members", value: "156", change: "+8% growth", icon: Users, iconClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400", changeClass: "text-green-600 dark:text-green-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-2 flex items-start justify-between">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <span className={`rounded-md p-1.5 ${stat.iconClass}`}>
                    <stat.icon className="h-4 w-4 block" />
                  </span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${stat.changeClass}`}>
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Participants</h3>
                  <div className="flex gap-2">
                    <button type="button" className="rounded-md px-3 py-1 text-xs font-bold text-primary hover:bg-primary/5">View All</button>
                    <button type="button" className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1 text-xs font-bold dark:border-slate-700">
                      <Download className="h-3.5 w-3.5" />
                      CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Participant</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Event Name</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Status</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {PARTICIPANTS.map((row) => (
                        <tr key={row.email}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                {row.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{row.name}</p>
                                <p className="text-[10px] text-slate-500">{row.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{row.event}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                                row.status === "Confirmed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button type="button" className="text-slate-400 transition-colors hover:text-primary">
                              <MoreVertical className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registration Trends</h3>
                  <select className="rounded-lg border border-slate-200 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                  </select>
                </div>
                <div className="flex h-48 w-full items-end gap-2 px-2">
                  {[30, 45, 25, 60, 80, 40, 100, 35, 50, 20, 45, 30].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm bg-primary/10 transition-all hover:bg-primary/20"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Quick Announcement</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Subject line"
                    value={announcementSubject}
                    onChange={(e) => setAnnouncementSubject(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <textarea
                    placeholder="Write your message to club members..."
                    rows={3}
                    value={announcementBody}
                    onChange={(e) => setAnnouncementBody(e.target.value)}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button type="button" className="rounded p-1.5 text-slate-400 transition-colors hover:text-primary">
                        <Upload className="h-5 w-5" />
                      </button>
                      <button type="button" className="rounded p-1.5 text-slate-400 transition-colors hover:text-primary" title="Image">
                        <ImageIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <button type="button" className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm">
                      Publish
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm dark:bg-primary/10">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-none text-slate-900 dark:text-white">Certificate Tool</h3>
                    <p className="mt-1 text-[10px] font-medium text-slate-500">Bulk generate PDF certificates</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Hackathon_Template.pdf</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-[10px] text-slate-500">Ready for 124 participants</p>
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-sm"
                  >
                    <Sparkles className="h-[18px] w-[18px]" />
                    Generate All
                  </button>
                  <button type="button" className="w-full py-2 text-xs font-bold text-primary hover:underline">
                    Change Template
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Upcoming</h3>
                <div className="space-y-4">
                  {MILESTONES.map((m, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`size-2 rounded-full ring-4 ring-primary/10 ${
                            m.active ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        />
                        {i < MILESTONES.length - 1 && (
                          <div className="mt-1 h-full w-0.5 bg-slate-100 dark:bg-slate-800" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{m.title}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{m.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
