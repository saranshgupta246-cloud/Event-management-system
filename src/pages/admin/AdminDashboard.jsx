import React, { useMemo, useState } from "react";
import useAdminDashboardStats from "../../hooks/useAdminDashboardStats";

const ADMIN_PRIMARY = "#ec5b13";

function formatTimeAgo(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
}

export default function AdminDashboard() {
  const { stats, chart, activities, loading, error } = useAdminDashboardStats();
  const [range, setRange] = useState("monthly");

  const chartData = useMemo(() => {
    const current = range === "daily" ? chart.daily : chart.monthly;
    if (!current || current.length === 0) return [];
    return current;
  }, [chart.daily, chart.monthly, range]);

  const maxValue = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData.reduce((max, item) => Math.max(max, item.value || 0), 0);
  }, [chartData]);

  return (
    <div className="admin-page-shell flex flex-1 flex-col min-w-0 overflow-x-hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-7xl mx-auto w-full">
          <header className="flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Overview
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Admin Dashboard
            </h1>
          </header>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="admin-card p-5 sm:p-6 lg:p-7 rounded-2xl border shadow-lg/60 dark:shadow-2xl/80 hover:-translate-y-0.5 hover:shadow-xl transition transform duration-150">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <span className="material-symbols-outlined text-blue-500">person</span>
                </div>
                {!loading && (
                  <span className="text-xs font-medium admin-muted">
                    All students
                  </span>
                )}
              </div>
              <p className="admin-muted text-sm font-medium">
                Total Students
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {loading ? "0" : stats.totalStudents}
              </h3>
            </div>
            <div className="admin-card p-5 sm:p-6 lg:p-7 rounded-2xl border shadow-lg/60 dark:shadow-2xl/80 hover:-translate-y-0.5 hover:shadow-xl transition transform duration-150">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-[color:rgba(236,91,19,0.12)]">
                  <span className="material-symbols-outlined" style={{ color: ADMIN_PRIMARY }}>
                    event
                  </span>
                </div>
                {!loading && (
                  <span className="text-xs font-medium admin-muted">
                    Current
                  </span>
                )}
              </div>
              <p className="admin-muted text-sm font-medium">
                Active Events
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {loading ? "0" : stats.activeEvents}
              </h3>
            </div>
            <div className="admin-card p-5 sm:p-6 lg:p-7 rounded-2xl border shadow-lg/60 dark:shadow-2xl/80 hover:-translate-y-0.5 hover:shadow-xl transition transform duration-150">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <span className="material-symbols-outlined text-purple-500">
                    verified
                  </span>
                </div>
                {!loading && (
                  <span className="text-xs font-medium text-purple-500">
                    Attendance based
                  </span>
                )}
              </div>
              <p className="admin-muted text-sm font-medium">
                Certificates Issued
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {loading ? "0" : stats.certificatesIssued}
              </h3>
            </div>
            <div className="admin-card p-5 sm:p-6 lg:p-7 rounded-2xl border shadow-lg/60 dark:shadow-2xl/80 hover:-translate-y-0.5 hover:shadow-xl transition transform duration-150">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <span className="material-symbols-outlined text-orange-500">
                    diversity_3
                  </span>
                </div>
                {!loading && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: ADMIN_PRIMARY }}
                  >
                    Club leaders
                  </span>
                )}
              </div>
              <p className="admin-muted text-sm font-medium">
                Club Recruitment
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {loading ? "0" : stats.clubRecruitment}
              </h3>
            </div>
          </div>

          {/* Chart + Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 admin-card p-5 sm:p-6 lg:p-7 rounded-2xl border shadow-lg/60 dark:shadow-2xl/80">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    System Analytics
                  </h4>
                  <p className="text-xs admin-muted">
                    Event participation trends for Current Semester
                  </p>
                </div>
                <div className="flex gap-2 rounded-full bg-slate-100/80 dark:bg-slate-900/80 p-1">
                  <button
                    type="button"
                    onClick={() => setRange("daily")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      range === "daily"
                        ? "text-white shadow-lg"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                    style={
                      range === "daily"
                        ? {
                            backgroundColor: ADMIN_PRIMARY,
                            boxShadow: `${ADMIN_PRIMARY}33 0 10px 15px`,
                          }
                        : undefined
                    }
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setRange("monthly")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      range === "monthly"
                        ? "text-white shadow-lg"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                    style={
                      range === "monthly"
                        ? {
                            backgroundColor: ADMIN_PRIMARY,
                            boxShadow: `${ADMIN_PRIMARY}33 0 10px 15px`,
                          }
                        : undefined
                    }
                  >
                    Monthly
                  </button>
                </div>
              </div>
              <div className="h-64 flex flex-col justify-end">
                <div className="flex items-end justify-between h-48 gap-2 sm:gap-4 px-1 sm:px-2 border-b border-slate-200 dark:border-slate-800">
                  {chartData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs admin-muted">
                      {loading ? "Loading activity..." : "No activity yet"}
                    </div>
                  ) : (
                    chartData.map((item) => {
                      const value = item.value || 0;
                      const ratio = maxValue > 0 ? value / maxValue : 0;
                      const heightPercent = `${Math.max(ratio * 100, 4)}%`;
                      return (
                        <div
                          key={item.label}
                          className="flex-1 rounded-t-lg relative group min-h-[8px] bg-orange-500/15"
                          style={{
                            height: heightPercent,
                          }}
                        >
                          <div
                            className="absolute inset-0 rounded-t-lg opacity-60 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: ADMIN_PRIMARY }}
                          />
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-slate-700 dark:text-slate-200">
                            {value}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex justify-between px-1 sm:px-2 pt-4">
                  {(chartData.length === 0 ? (range === "daily" ? [] : []) : chartData).map(
                    (item) => (
                      <span
                        key={item.label}
                        className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500"
                      >
                        {item.label}
                      </span>
                    )
                  )}
                </div>
                {error && !loading && (
                  <p className="mt-2 text-[11px] text-red-500">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="admin-card p-5 sm:p-6 lg:p-7 rounded-2xl border shadow-lg/60 dark:shadow-2xl/80">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-6">
                Global Activities
              </h4>
              <div className="space-y-6">
                {(!activities || activities.length === 0) && !loading && (
                  <p className="text-xs admin-muted">
                    No recent activity.
                  </p>
                )}
                {activities &&
                  activities.map((item) => {
                    const audience = item.audience || "all";
                    const configMap = {
                      all: {
                        icon: "campaign",
                        bg: `${ADMIN_PRIMARY}1A`,
                        fg: ADMIN_PRIMARY,
                      },
                      students: {
                        icon: "school",
                        bg: "rgba(59, 130, 246, 0.1)",
                        fg: "#3b82f6",
                      },
                      faculty: {
                        icon: "badge",
                        bg: "rgba(34, 197, 94, 0.1)",
                        fg: "#22c55e",
                      },
                      club_leaders: {
                        icon: "diversity_3",
                        bg: "rgba(249, 115, 22, 0.12)",
                        fg: "#f97316",
                      },
                    };
                    const config = configMap[audience] || configMap.all;

                    return (
                      <div
                        key={item.id || item._id}
                        className="flex gap-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 px-2 py-2 transition-colors"
                      >
                        <div
                          className="size-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: config.bg }}
                        >
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ color: config.fg }}
                          >
                            {config.icon}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {item.title}
                          </p>
                          <p className="text-xs admin-muted">
                            {formatTimeAgo(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

        </div>

        <footer className="mt-auto py-6 px-6 sm:px-8 text-center text-[10px] text-slate-400 uppercase tracking-widest border-t border-slate-200 dark:border-slate-800">
          MITS Gwalior © 2023 Event Management Information System (EMIS) - Elite
          Academic Portal
        </footer>
    </div>
  );
}
