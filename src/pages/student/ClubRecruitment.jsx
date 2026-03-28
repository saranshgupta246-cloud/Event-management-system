import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  LayoutGrid,
  Terminal,
  Palette,
  Dumbbell,
  Megaphone,
  Upload,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { id: "all", label: "All Drives", icon: LayoutGrid, active: true },
  { id: "tech", label: "Tech Clubs", icon: Terminal, active: false },
  { id: "cultural", label: "Cultural Clubs", icon: Palette, active: false },
  { id: "sports", label: "Sports Clubs", icon: Dumbbell, active: false },
  { id: "marketing", label: "Marketing", icon: Megaphone, active: false },
];

const DRIVES = [
  { id: 1, club: "Coding Club", role: "Full-Stack Developer", desc: "Looking for a passionate dev to lead our internal portal project. Experience with React and Node.js required.", badge: "Ends in 2 days", badgeClass: "bg-red-100 text-red-600", applicants: 16, open: true },
  { id: 2, club: "Creative Arts Society", role: "Social Media Lead", desc: "Manage our Instagram and Behance presence. Must have an eye for aesthetic layouts and trending content.", badge: "7 days left", badgeClass: "bg-slate-100 text-slate-600 dark:bg-[#161f2e] dark:text-slate-400", applicants: 6, open: true },
  { id: 3, club: "E-Cell", role: "Sponsorship Manager", desc: "Reach out to corporate partners for our annual E-Summit. Excellent communication skills are a must.", badge: "4 days left", badgeClass: "bg-slate-100 text-slate-600 dark:bg-[#161f2e] dark:text-slate-400", applicants: 23, open: true },
  { id: 4, club: "Robotics Society", role: "Hardware Engineer", desc: "Design and assemble PCBs for the upcoming inter-college robot wars event.", badge: "Closed", badgeClass: "bg-slate-200 text-slate-500 dark:bg-[#161f2e] dark:text-slate-500", applicants: 1, open: false },
];

const TRACKING = [
  { role: "UI/UX Designer @ DesignClub", status: "Selected for Interview", statusClass: "text-green-500", sub: "Scheduled for: Oct 24, 2:00 PM" },
  { role: "Content Writer @ LiterarySoc", status: "Under Review", statusClass: "text-slate-500", sub: "Applied: 3 days ago" },
];

export default function ClubRecruitment() {
  const [sop, setSop] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [selectedDrive, setSelectedDrive] = useState(DRIVES[0]);
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <main className="relative mx-auto flex max-w-[1400px] gap-6 p-4 md:p-6">
        {/* Left sidebar */}
        <aside className="flex w-64 shrink-0 flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
            <div className="mb-6 flex flex-col gap-1">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Recruitment</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Find your next role on campus</p>
            </div>
            <nav className="flex flex-col gap-1">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    item.active
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Your Progress</h3>
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-[#1e2d42] dark:bg-[#161f2e]">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Applied</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">12</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-[#1e2d42] dark:bg-[#161f2e]">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Interviews</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">03</p>
              </div>
              <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
                <p className="text-xs font-medium text-primary">Offers</p>
                <p className="text-xl font-bold text-primary">01</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main feed */}
        <section className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap justify-between items-end gap-3">
              <div className="flex flex-col gap-2">
                <p className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                  Club Recruitment
                </p>
                <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  Discover leadership and member roles across campus organizations.
                </p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                24 Active Drives
              </div>
            </div>
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <Search className="h-5 w-5" />
              </div>
              <input
                id="club-recruitment-demo-search"
                name="club-recruitment-demo-search"
                type="text"
                placeholder="Search for clubs, roles, or skills (e.g., Python, Design)..."
                className="block h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-primary dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {DRIVES.map((drive) => (
              <div
                key={drive.id}
                className={`rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-[#1e2d42] dark:bg-[#161f2e] ${
                  !drive.open ? "opacity-80" : ""
                } ${selectedDrive?.id === drive.id ? "ring-2 ring-primary/60" : ""}`}
              >
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 dark:border-[#1e2d42] dark:bg-[#161f2e]">
                    <Terminal className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold leading-none text-slate-900 dark:text-white">{drive.club}</h3>
                        <p className="mt-1 text-sm font-semibold text-primary">{drive.role}</p>
                      </div>
                      <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${drive.badgeClass}`}>
                        {drive.badge}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{drive.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-[#1e2d42]">
                  <div className="flex -space-x-2">
                    <div className="size-7 rounded-full border-2 border-white bg-slate-200 dark:border-[#0d1117]" />
                    <div className="size-7 rounded-full border-2 border-white bg-slate-300 dark:border-[#0d1117]" />
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-slate-400 text-[10px] font-bold dark:border-[#0d1117]">
                      +{drive.applicants - 2}
                    </div>
                  </div>
                  {drive.open ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDrive(drive);
                        setQuickOpen(true);
                      }}
                      className="rounded-lg bg-primary px-6 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90"
                    >
                      Apply Now
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-lg bg-slate-200 px-6 py-2 text-xs font-bold text-slate-500 dark:bg-[#161f2e]"
                    >
                      Application Closed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Quick Apply overlay drawer */}
      {quickOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/10">
          <div
            className="hidden md:block flex-1"
            onClick={() => setQuickOpen(false)}
          />
          <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl md:mr-6 md:mt-6 rounded-none md:rounded-2xl dark:bg-[#161f2e]">
            <div className="border-b border-slate-200 bg-slate-50/60 p-5 dark:border-[#1e2d42] dark:bg-[#161f2e]/40 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Quick Apply</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Applying for{" "}
                  <span className="font-bold text-primary">{selectedDrive?.role}</span>{" "}
                  at <span className="font-bold text-primary">{selectedDrive?.club}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickOpen(false)}
                className="ml-3 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                aria-label="Close"
              >
                <span className="block h-4 w-4">×</span>
              </button>
            </div>
            <form
              className="flex flex-1 flex-col gap-4 overflow-y-auto p-5"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="club-recruitment-quick-sop" className="text-xs font-bold text-slate-900 dark:text-slate-300">
                  Statement of Purpose
                </label>
                <textarea
                  id="club-recruitment-quick-sop"
                  name="club-recruitment-quick-sop"
                  placeholder="Tell us why you are a good fit for this role..."
                  value={sop}
                  onChange={(e) => setSop(e.target.value)}
                  rows={4}
                  className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="club-recruitment-quick-portfolio" className="text-xs font-bold text-slate-900 dark:text-slate-300">
                  Portfolio / Github Link
                </label>
                <input
                  id="club-recruitment-quick-portfolio"
                  name="club-recruitment-quick-portfolio"
                  type="url"
                  placeholder="https://github.com/yourusername"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-300">
                  Resume Upload
                </span>
                <div className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 p-6 text-center transition-colors hover:bg-slate-50 dark:border-[#1e2d42] dark:hover:bg-slate-800">
                  <Upload className="h-8 w-8 text-primary" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click to upload or drag &amp; drop PDF
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-primary py-3 font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Submit Application
              </button>
              <p className="text-center text-[10px] text-slate-500 dark:text-slate-500">
                By submitting, you agree to the club&apos;s code of conduct and selection process.
              </p>
              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-[#1e2d42]">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Recent Tracking
                </h4>
                <div className="flex flex-col gap-3">
                  {TRACKING.map((t, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="relative flex flex-col items-center">
                        <div className="mt-1.5 size-2 rounded-full bg-primary" />
                        {i < TRACKING.length - 1 && (
                          <div className="mt-1 h-full w-0.5 bg-slate-200 dark:bg-[#1e2d42]" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{t.role}</p>
                        <p className={`mt-0.5 text-[10px] font-bold uppercase ${t.statusClass}`}>
                          {t.status}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-500">
                          {t.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-4 w-full text-xs font-bold text-primary hover:underline"
                >
                  View all applications
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
