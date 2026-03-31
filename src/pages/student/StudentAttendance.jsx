import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useMyRegistrations from "../../hooks/useMyRegistrations";
import { PageTitle, BodyText } from "../../components/ui/Typography";
import { eventRouteSegment } from "../../utils/eventRoutes";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const FILTERS = ["all", "present", "absent"];

export default function StudentAttendance() {
  const { items, loading, error } = useMyRegistrations();
  const [filter, setFilter] = useState("all");

  const attendanceItems = useMemo(() => {
    return items.filter((reg) => {
      if (reg.status !== "confirmed") return false;
      const eventStatus = reg.event?.status;
      return eventStatus === "completed" || eventStatus === "ongoing";
    });
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return attendanceItems;
    return attendanceItems.filter((reg) => reg.attendanceStatus === filter);
  }, [attendanceItems, filter]);

  const stats = useMemo(() => {
    const present = attendanceItems.filter((r) => r.attendanceStatus === "present").length;
    const total = attendanceItems.length;
    const pct = total === 0 ? 0 : Math.round((present / total) * 100);
    return { present, absent: total - present, total, pct };
  }, [attendanceItems]);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <PageTitle className="mb-1">My Attendance</PageTitle>
      <BodyText className="mb-6">
        Your attendance record across completed and ongoing events.
      </BodyText>

      {!loading && !error && attendanceItems.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Events attended", value: stats.present, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Events missed", value: stats.absent, color: "text-rose-500 dark:text-rose-400" },
            { label: "Attendance rate", value: `${stats.pct}%`, color: stats.pct >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-[#161f2e] rounded-[16px] border border-slate-200 dark:border-[#1e2d42] p-4 text-center"
            >
              <p className={`text-2xl font-semibold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && attendanceItems.length > 0 && (
        <div className="flex gap-2 mb-5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
                filter === f
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#1e2d42] dark:text-slate-300 dark:hover:bg-[#243346]"
              }`}
            >
              {f === "all"
                ? `All (${attendanceItems.length})`
                : f === "present"
                ? `Present (${stats.present})`
                : `Absent (${stats.absent})`}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-[#161f2e] rounded-[18px] border border-slate-200 dark:border-[#1e2d42] p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2 animate-pulse">
            hourglass_empty
          </span>
          <p className="text-sm text-slate-500">Loading attendance...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-[18px] border border-red-200 dark:border-red-800 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && attendanceItems.length === 0 && (
        <div className="bg-white dark:bg-[#161f2e] rounded-[18px] border border-slate-200 dark:border-[#1e2d42] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">
            event_available
          </span>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No attendance records yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            Attendance will appear here once you have registered for and attended events.
          </p>
          <Link
            to="/student/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-all"
          >
            <span className="material-symbols-outlined">search</span>
            Browse Events
          </Link>
        </div>
      )}

      {!loading && !error && attendanceItems.length > 0 && filtered.length === 0 && (
        <div className="bg-white dark:bg-[#161f2e] rounded-[18px] border border-slate-200 dark:border-[#1e2d42] p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">No {filter} events to show.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ul className="space-y-3">
          {filtered.map((reg) => {
            const event = reg.event || {};
            const isPresent = reg.attendanceStatus === "present";
            return (
              <li key={reg._id}>
                <div className="bg-white dark:bg-[#161f2e] rounded-[18px] border border-slate-200 dark:border-[#1e2d42] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isPresent
                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                        : "bg-rose-100 dark:bg-rose-900/20"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-xl ${
                        isPresent
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-500 dark:text-rose-400"
                      }`}
                    >
                      {isPresent ? "check_circle" : "cancel"}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {event.title || "Event"}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(event.eventDate)}
                      {event.location ? ` • ${event.location}` : ""}
                    </p>
                    {isPresent && reg.attendanceMarkedAt && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Marked {formatDate(reg.attendanceMarkedAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        isPresent
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
                      }`}
                    >
                      {isPresent ? "Present" : "Absent"}
                    </span>
                    {event._id && (
                      <Link
                        to={`/student/events/${eventRouteSegment(event)}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
