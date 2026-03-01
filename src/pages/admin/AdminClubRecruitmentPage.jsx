import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, Users, Building2 } from "lucide-react";
import useAdminClubs from "../../hooks/useAdminClubs";

const CATEGORIES = [
  { value: "Technical", label: "Technical", color: "#2563EB" },
  { value: "Cultural", label: "Cultural", color: "#7C3AED" },
  { value: "Sports", label: "Sports", color: "#16A34A" },
  { value: "Marketing", label: "Marketing", color: "#EA580C" },
];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

export default function AdminClubRecruitmentPage() {
  const { items: clubs, loading, error, refetch } = useAdminClubs({});

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

      {clubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 dark:border-slate-700 dark:bg-slate-900">
          <Building2 className="h-20 w-20 text-slate-200 dark:text-slate-600" aria-hidden />
          <p className="mt-4 text-xl font-semibold text-slate-600 dark:text-slate-400">
            No clubs yet
          </p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Create your first club to get started
          </p>
          <Link
            to="/admin/clubs"
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Club
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => {
            const cat = CATEGORY_MAP[club.category];
            const openDrives = club.openDrivesCount ?? 0;
            return (
              <div
                key={club._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-start gap-3">
                  {club.logoUrl ? (
                    <img
                      src={club.logoUrl}
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
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                      {club.name}
                    </h2>
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: cat?.color || "#6B7280" }}
                    >
                      {club.category || "—"}
                    </span>
                    {openDrives > 0 && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        {openDrives} open drive{openDrives !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/leader/clubs/${club._id}/recruitment`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Briefcase className="h-4 w-4" />
                    Recruitment
                  </Link>
                  <Link
                    to={`/leader/clubs/${club._id}/team`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Users className="h-4 w-4" />
                    Team
                  </Link>
                  <Link
                    to={`/admin/clubs/${club._id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Building2 className="h-4 w-4" />
                    View club
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
