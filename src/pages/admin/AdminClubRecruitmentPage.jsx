import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Users, Building2, Calendar, Search, PauseCircle, CheckCircle2, FileQuestion } from "lucide-react";
import { useRecruitmentDrives } from "../../hooks/useRecruitmentDrives";
import { resolveEventImageUrl } from "../../utils/eventUrls";
import { clubRouteSegment } from "../../utils/clubRoutes";

const CATEGORIES = [
  { value: "Technical", label: "Technical", color: "#2563EB" },
  { value: "Cultural", label: "Cultural", color: "#7C3AED" },
  { value: "Sports", label: "Sports", color: "#16A34A" },
  { value: "Marketing", label: "Marketing", color: "#EA580C" },
];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

export default function AdminClubRecruitmentPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { drives, loading, error } = useRecruitmentDrives({
    search: searchDebounced,
    status: statusFilter,
    page: 1,
    limit: 100,
  });

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const stats = useMemo(() => {
    return drives.reduce(
      (acc, drive) => {
        acc.total += 1;
        if (drive.status === "open") acc.open += 1;
        if (drive.status === "paused") acc.paused += 1;
        if (drive.status === "closed") acc.closed += 1;
        return acc;
      },
      { total: 0, open: 0, paused: 0, closed: 0 }
    );
  }, [drives]);

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-red-600">{error}</p>
        <Link to="/admin/clubs" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to clubs
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Club Recruitment
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Open recruitment drives and team management for each club
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard icon={Briefcase} label="Total drives" value={stats.total} />
        <StatCard icon={CheckCircle2} label="Open" value={stats.open} />
        <StatCard icon={PauseCircle} label="Paused" value={stats.paused} />
        <StatCard icon={FileQuestion} label="Closed" value={stats.closed} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="admin-recruitment-drive-search"
            name="admin-recruitment-drive-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drives or clubs..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
          />
        </div>
        <select
          id="admin-recruitment-status-filter"
          name="admin-recruitment-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {drives.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 dark:border-[#1e2d42] dark:bg-[#161f2e]">
          <Building2 className="h-20 w-20 text-slate-200 dark:text-slate-600" aria-hidden />
          <p className="mt-4 text-xl font-semibold text-slate-600 dark:text-slate-400">
            No recruitment drives found
          </p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Drives created from club recruitment pages will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {drives.map((drive) => {
            const club = drive.clubId || {};
            const cat = CATEGORY_MAP[club.category];
            const logoSrc = club.logoUrl ? resolveEventImageUrl(club.logoUrl) : "";
            return (
              <div
                key={drive._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-[#1e2d42] dark:bg-[#161f2e]"
              >
                <div className="flex items-start gap-3">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: cat?.color || "#6B7280" }}
                    >
                      {club.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                      {club.name || "Club"}
                    </p>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                      {drive.roleTitle || drive.title || "Recruitment Drive"}
                    </h2>
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: cat?.color || "#6B7280" }}
                    >
                      {drive.status || "draft"}
                    </span>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                      {drive.description || "No description provided."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {drive.applicantCount ?? 0} applicants
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {drive.deadline ? new Date(drive.deadline).toLocaleDateString() : "No deadline"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/admin/clubs/${clubRouteSegment(club)}/drives/${drive._id}/applications`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Briefcase className="h-4 w-4" />
                    View Applications
                  </Link>
                  <Link
                    to={`/admin/clubs/${clubRouteSegment(club)}/recruitment`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Briefcase className="h-4 w-4" />
                    Manage Drive
                  </Link>
                  <Link
                    to={`/admin/clubs/${clubRouteSegment(club)}/team`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Users className="h-4 w-4" />
                    Team
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
