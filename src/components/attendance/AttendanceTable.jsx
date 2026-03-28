import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

function StatusBadge({ status }) {
  const value = (status || "").toLowerCase();
  if (value === "present" || value === "checked_in") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-200 dark:ring-emerald-900/50">
        Checked In
      </span>
    );
  }
  if (value === "absent") {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-100 dark:bg-rose-900/20 dark:text-rose-200 dark:ring-rose-900/50">
        Not Arrived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100 dark:bg-amber-900/20 dark:text-amber-200 dark:ring-amber-900/50">
      Pending
    </span>
  );
}

export default function AttendanceTable({
  participants,
  loading,
  search,
  onSearchChange,
  statusFilter = "pending",
  onStatusFilterChange,
  onManualMark,
  onBulkMark,
}) {
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const records = useMemo(
    () => (Array.isArray(participants) ? participants : []),
    [participants]
  );

  const nonPresentIdsInView = useMemo(
    () =>
      records
        .filter((p) => {
          const value = String(p.status || "").toLowerCase();
          return !(value === "present" || value === "checked_in");
        })
        .map((p) => p.id),
    [records]
  );

  const allSelectableChecked =
    nonPresentIdsInView.length > 0 &&
    nonPresentIdsInView.every((id) => selectedIds.includes(id));

  const handleToggleSelectAll = () => {
    if (!nonPresentIdsInView.length) {
      setSelectedIds([]);
      return;
    }
    if (allSelectableChecked) {
      setSelectedIds((prev) => prev.filter((id) => !nonPresentIdsInView.includes(id)));
      return;
    }
    setSelectedIds((prev) =>
      Array.from(new Set([...prev, ...nonPresentIdsInView]))
    );
  };

  const handleToggleRowSelect = (id, isPresent) => {
    if (!id || isPresent) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleManualClick = async (id) => {
    if (!onManualMark || !id) return;
    setActionLoadingId(id);
    try {
      await onManualMark(id);
    } finally {
      setActionLoadingId(null);
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleBulkMarkSelected = async () => {
    if (!onBulkMark || !selectedIds.length || bulkLoading) return;
    setBulkLoading(true);
    try {
      await onBulkMark(selectedIds);
      setSelectedIds([]);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl bg-white dark:bg-[#161f2e] shadow-lg ring-1 ring-slate-100 dark:ring-slate-800"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-[#1e2d42] dark:text-slate-400">
        <span>Live Attendance</span>
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {records.length} records
        </span>
      </div>

      <div className="border-b border-slate-100 px-5 py-3 dark:border-[#1e2d42]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="attendance-search"
              name="attendance-search"
              type="text"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:bg-slate-900 dark:focus:ring-indigo-900/40"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-[#161f2e] dark:text-slate-300 dark:ring-slate-700">
              <span>Filter:</span>
              <button
                type="button"
                onClick={() => onStatusFilterChange?.("all")}
                className={`rounded-full px-2 py-0.5 ${
                  statusFilter === "all"
                    ? "bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => onStatusFilterChange?.("pending")}
                className={`rounded-full px-2 py-0.5 ${
                  statusFilter === "pending"
                    ? "bg-amber-500 text-white"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => onStatusFilterChange?.("present")}
                className={`rounded-full px-2 py-0.5 ${
                  statusFilter === "present"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Checked In
              </button>
            </div>
            {onBulkMark && records.length > 0 && (
              <button
                type="button"
                onClick={handleBulkMarkSelected}
                disabled={!selectedIds.length || bulkLoading}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bulkLoading
                  ? "Marking..."
                  : `Mark selected present (${selectedIds.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-h-[480px] overflow-y-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-[#161f2e] dark:text-slate-400">
            <tr>
              {onBulkMark && (
                <th className="w-10 px-5 py-2.5">
                  <input
                    id="attendance-select-all"
                    name="attendance-select-all"
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    onChange={handleToggleSelectAll}
                    checked={allSelectableChecked}
                    aria-label="Select all pending attendees on this page"
                  />
                </th>
              )}
              <th className="px-5 py-2.5">Name</th>
              <th className="px-5 py-2.5">Email</th>
              <th className="px-5 py-2.5">Check-in Time</th>
              <th className="px-5 py-2.5">Status</th>
              <th className="px-5 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <AnimatePresence initial={false} component="tbody">
            <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
              {loading && records.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    Loading attendance data...
                  </td>
                </tr>
              )}

              {!loading &&
                records.map((p) => {
                  const name = p.name || "Unknown";
                  const initials = name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const rawTime =
                    p.checkInTime ||
                    p.attendanceMarkedAt ||
                    p.attendedAt ||
                    p.updatedAt ||
                    p.registeredAt;
                  const checkInTime = rawTime
                    ? new Date(rawTime).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  const isPresent =
                    String(p.status).toLowerCase() === "present" ||
                    String(p.status).toLowerCase() === "checked_in";
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                    >
                      {onBulkMark && (
                        <td className="px-5 py-2.5">
                          <input
                            id={`attendance-select-${p.id}`}
                            name={`attendance-select-${p.id}`}
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                            disabled={isPresent}
                            checked={isSelected}
                            onChange={() => handleToggleRowSelect(p.id, isPresent)}
                            aria-label={`Select ${name} for bulk mark present`}
                          />
                        </td>
                      )}
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700 dark:bg-[#1e2d42] dark:text-slate-100">
                            {initials || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-50">
                              {name}
                            </p>
                            {p.userId && (
                              <p className="text-[11px] text-slate-500">{p.userId}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                        {p.email || "—"}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                        {checkInTime}
                      </td>
                      <td className="px-5 py-2.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {isPresent ? (
                          <span className="text-[11px] text-slate-400">
                            Already checked in
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleManualClick(p.id)}
                            disabled={actionLoadingId === p.id}
                            className="inline-flex items-center justify-center rounded-full border border-emerald-500 px-3 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
                          >
                            {actionLoadingId === p.id ? "Updating..." : "Mark Present"}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}

              {!loading && records.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    No registrations found for this event yet.
                  </td>
                </tr>
              )}
            </tbody>
          </AnimatePresence>
        </table>
      </div>
    </motion.div>
  );
}

