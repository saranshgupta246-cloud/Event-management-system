import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import api from "../../services/api";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function fetchAllEventRegistrations(eventId) {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await api.get(`/api/registrations/event/${eventId}/participants`, {
      params: { page, limit: 100, status: "all" },
    });
    if (!res.data?.success) {
      throw new Error(res.data?.message || "Failed to load registrations");
    }
    const { items = [], pages = 1 } = res.data.data || {};
    all.push(...items);
    totalPages = Math.max(1, pages);
    page += 1;
  } while (page <= totalPages && page <= 50);
  return all;
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  if (s === "confirmed") {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        Confirmed
      </span>
    );
  }
  if (s === "cancelled" || s === "revoked") {
    return (
      <span className="inline-flex rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 capitalize">
        {s}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 capitalize">
      {status || "—"}
    </span>
  );
}

function RegistrationStatusCell({ r }) {
  if (r.status === "cancelled" || r.status === "revoked") {
    return <StatusBadge status={r.status} />;
  }
  if (r.paymentStatus === "pending") {
    return (
      <span className="inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
        Pending
      </span>
    );
  }
  if (r.status === "confirmed") {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        Confirmed
      </span>
    );
  }
  return <StatusBadge status={r.status} />;
}

function AttendanceBadge({ attendanceStatus }) {
  const a = String(attendanceStatus || "").toLowerCase();
  if (a === "present") {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        Present
      </span>
    );
  }
  if (a === "absent") {
    return (
      <span className="inline-flex rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
        Absent
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
      Not marked
    </span>
  );
}

function TableSkeleton({ rows = 8 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1e2d42] dark:bg-[#161f2e]">
      <div className="animate-pulse">
        <div className="h-10 bg-slate-100 dark:bg-[#1e2d42]/80" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 border-t border-slate-100 px-4 py-3 dark:border-[#1e2d42]">
            <div className="h-4 flex-1 rounded bg-slate-200 dark:bg-[#1e2d42]" />
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-[#1e2d42]" />
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-[#1e2d42]" />
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-[#1e2d42]" />
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-[#1e2d42]" />
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-[#1e2d42]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeaderParticipants() {
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  const [selectedEventId, setSelectedEventId] = useState("");

  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [regsError, setRegsError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const res = await api.get("/api/leader/events");
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setEvents(list);
      setSelectedEventId((prev) => {
        if (prev && list.some((e) => String(e._id) === String(prev))) return prev;
        return list[0]?._id ? String(list[0]._id) : "";
      });
    } catch (e) {
      setEvents([]);
      setEventsError(e.response?.data?.message || e.message || "Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const loadRegistrations = useCallback(async (eventId) => {
    if (!eventId) {
      setRegistrations([]);
      return;
    }
    setRegsLoading(true);
    setRegsError(null);
    try {
      const all = await fetchAllEventRegistrations(eventId);
      setRegistrations(all);
    } catch (e) {
      setRegistrations([]);
      setRegsError(e.response?.data?.message || e.message || "Failed to load registrations");
    } finally {
      setRegsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    loadRegistrations(selectedEventId);
  }, [selectedEventId, loadRegistrations]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const confirmed = registrations.filter((r) => r.status === "confirmed").length;
    const pending = registrations.filter((r) => r.paymentStatus === "pending").length;
    const attended = registrations.filter((r) => r.attendanceStatus === "present").length;
    return { total, confirmed, pending, attended };
  }, [registrations]);

  const filteredByTab = useMemo(() => {
    return registrations.filter((r) => {
      if (statusTab === "all") return true;
      if (statusTab === "confirmed") return r.status === "confirmed";
      if (statusTab === "pending") return r.paymentStatus === "pending";
      if (statusTab === "cancelled") return r.status === "cancelled" || r.status === "revoked";
      return true;
    });
  }, [registrations, statusTab]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredByTab;
    return filteredByTab.filter((r) => {
      const name = (r.user?.name || "").toLowerCase();
      const email = (r.user?.email || "").toLowerCase();
      const roll = String(r.user?.studentId || "").toLowerCase();
      return name.includes(q) || email.includes(q) || roll.includes(q);
    });
  }, [filteredByTab, search]);

  const selectedEventTitle =
    events.find((e) => String(e._id) === String(selectedEventId))?.title || "";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#0d1117] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Participants
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View registrations across your club events
          </p>
        </div>

        {eventsLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading events…
          </div>
        ) : eventsError ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {eventsError}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-400">
            No events found for your club. Create an event to see participants here.
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label
                htmlFor="leader-participants-event"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Event
              </label>
              <select
                id="leader-participants-event"
                name="leader-participants-event"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full max-w-xl rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-600/30 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-100"
              >
                {events.map((ev) => (
                  <option key={ev._id} value={String(ev._id)}>
                    {ev.title || "Untitled event"}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Total registrations", value: stats.total },
                { label: "Confirmed", value: stats.confirmed },
                { label: "Pending", value: stats.pending },
                { label: "Attended", value: stats.attended },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {s.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  id="leader-participants-search"
                  name="leader-participants-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or roll number…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-100"
                />
              </div>
              <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-[#1e2d42] dark:bg-[#161f2e]">
                {[
                  { id: "all", label: "All" },
                  { id: "confirmed", label: "Confirmed" },
                  { id: "pending", label: "Pending" },
                  { id: "cancelled", label: "Cancelled" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusTab(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      statusTab === tab.id
                        ? "bg-primary-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {regsError && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                {regsError}
              </div>
            )}

            {regsLoading ? (
              <TableSkeleton />
            ) : filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {registrations.length === 0
                    ? "No registrations for this event yet."
                    : "No registrations match your search or filter."}
                </p>
                {selectedEventTitle && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{selectedEventTitle}</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Roll No</th>
                      <th className="px-4 py-3">Registration Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Attendance</th>
                      <th className="px-4 py-3">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d42]">
                    {filteredRows.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {r.user?.name || "—"}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-slate-600 dark:text-slate-400">
                          {r.user?.email || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {r.user?.studentId || "—"}
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-300">
                          {r.registrationType || "solo"}
                        </td>
                        <td className="px-4 py-3">
                          <RegistrationStatusCell r={r} />
                        </td>
                        <td className="px-4 py-3">
                          <AttendanceBadge attendanceStatus={r.attendanceStatus} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                          {formatDate(r.createdAt || r.registeredAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
