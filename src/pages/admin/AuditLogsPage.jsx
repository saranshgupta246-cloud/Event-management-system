import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const ACTIONS = [
  "USER_LOGIN",
  "USER_LOGIN_FAILED",
  "USER_ROLE_CHANGED",
  "USER_DEACTIVATED",
  "USER_ACTIVATED",
  "EVENT_CREATED",
  "EVENT_UPDATED",
  "EVENT_DELETED",
  "EVENT_CANCELLED",
  "CLUB_CREATED",
  "CLUB_UPDATED",
  "CLUB_DEACTIVATED",
  "MEMBER_ADDED",
  "MEMBER_REMOVED",
  "MEMBER_ROLE_CHANGED",
  "CERTIFICATE_GENERATED",
  "CERTIFICATE_TEMPLATE_UPLOADED",
  "BULK_CERTIFICATES_ISSUED",
  "RECRUITMENT_DRIVE_CREATED",
  "RECRUITMENT_DRIVE_CLOSED",
  "APPLICATION_APPROVED",
  "APPLICATION_REJECTED",
];

function getActionBadgeColor(action) {
  if (!action) return { bg: "bg-slate-500", text: "text-white" };
  if (action.startsWith("USER_")) return { bg: "bg-blue-500/20", text: "text-blue-400" };
  if (action.startsWith("EVENT_")) return { bg: "bg-indigo-500/20", text: "text-indigo-400" };
  if (action.startsWith("CLUB_")) return { bg: "bg-purple-500/20", text: "text-purple-400" };
  if (action.startsWith("MEMBER_")) return { bg: "bg-violet-500/20", text: "text-violet-400" };
  if (action.startsWith("CERTIFICATE_") || action.startsWith("BULK_"))
    return { bg: "bg-amber-500/20", text: "text-amber-400" };
  if (action.startsWith("RECRUITMENT_") || action.startsWith("APPLICATION_"))
    return { bg: "bg-emerald-500/20", text: "text-emerald-400" };
  return { bg: "bg-slate-500/20", text: "text-slate-300" };
}

function formatRelativeTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return "Just now";
  if (diffM < 60) return `${diffM} min ago`;
  if (diffH < 24) return `${diffH} hour(s) ago`;
  if (diffD < 7) return `${diffD} day(s) ago`;
  return d.toLocaleDateString();
}

export default function AuditLogsPage() {
  const { dark } = useTheme();
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    action: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/api/audit/stats");
      if (res.data?.success) setStats(res.data.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const params = { page, limit };
      if (filters.action) params.action = filters.action;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await api.get("/api/audit", { params });
      if (res.data?.success) {
        setItems(res.data.data.items || []);
        setTotal(res.data.data.total ?? 0);
        setPages(res.data.data.pages ?? 1);
      }
    } catch {
      setItems([]);
      setTotal(0);
      setPages(1);
    } finally {
      setLoadingLogs(false);
    }
  }, [page, limit, filters.action, filters.status, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearFilters = () => {
    setFilters({
      search: "",
      action: "",
      status: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  const bg = dark ? "#0f1117" : "#f8fafc";
  const cardBg = dark ? "#16161f" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.06)" : "#e2e8f0";
  const rowBg = dark ? "rgba(255,255,255,0.02)" : "transparent";

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: bg }}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track all admin actions
          </p>
        </header>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl border animate-pulse"
                style={{ backgroundColor: cardBg, borderColor: border }}
              />
            ))
          ) : (
            <>
              <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: cardBg, borderColor: border }}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total Logs
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.totalLogs ?? 0}
                </p>
              </div>
              <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: cardBg, borderColor: border }}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Today&apos;s Actions
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.todayLogs ?? 0}
                </p>
              </div>
              <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: cardBg, borderColor: border }}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Failed Actions
                </p>
                <p className="mt-1 text-2xl font-bold text-red-500">
                  {stats?.failedLogs ?? 0}
                </p>
              </div>
              <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: cardBg, borderColor: border }}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Most Common
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-slate-900 dark:text-white">
                  {stats?.recentActions?.[0]?._id ?? "—"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <div
          className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border p-4"
          style={{ backgroundColor: cardBg, borderColor: border }}
        >
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
              style={{ borderColor: border }}
            >
              <option value="">All Actions</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[120px]">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
              style={{ borderColor: border }}
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Start date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              className="rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
              style={{ borderColor: border }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              End date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
              className="rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
              style={{ borderColor: border }}
            />
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            style={{ borderColor: border }}
          >
            Clear filters
          </button>
        </div>

        {/* Table */}
        <div
          className="overflow-hidden rounded-xl border"
          style={{ backgroundColor: cardBg, borderColor: border }}
        >
          {loadingLogs ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl text-slate-400">📋</div>
              <p className="mt-2 font-medium text-slate-600 dark:text-slate-300">
                No audit logs yet
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Actions will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                      Time
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                      Action
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                      Performed By
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                      Target
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                      Details
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((log) => {
                    const badge = getActionBadgeColor(log.action);
                    return (
                      <tr
                        key={log._id}
                        style={{
                          borderBottom: `1px solid ${border}`,
                          backgroundColor: rowBg,
                        }}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                          {formatRelativeTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {log.performedBy?.avatar ? (
                              <img
                                src={log.performedBy.avatar}
                                alt=""
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-500 text-xs text-white">
                                {(log.performedBy?.name || "?")[0]}
                              </div>
                            )}
                            <span className="text-slate-900 dark:text-white">
                              {log.performedBy?.name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {log.targetUser?.name
                            ? `User: ${log.targetUser.name}`
                            : log.targetModel && log.details?.title
                            ? log.details.title
                            : log.targetModel && log.targetId
                            ? `${log.targetModel}`
                            : "—"}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-slate-600 dark:text-slate-300">
                          {log.details && Object.keys(log.details).length > 0
                            ? JSON.stringify(log.details)
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              log.status === "failed"
                                ? "rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400"
                                : "rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400"
                            }
                          >
                            {log.status || "success"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {log.ipAddress || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {items.length > 0 && (
            <div
              className="flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3"
              style={{ borderColor: border }}
            >
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Page {page} of {pages} · {total} total
              </p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">
                  Per page
                </label>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded border bg-transparent px-2 py-1 text-sm text-slate-900 dark:text-white"
                  style={{ borderColor: border }}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                  style={{ borderColor: border }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                  style={{ borderColor: border }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
