import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarSearch, AlertCircle } from "lucide-react";
import useAdminEvents from "../../hooks/useAdminEvents";
import useLeaderEvents from "../../hooks/useLeaderEvents";
import { isEventApproved } from "../../utils/eventApproval";

function formatEventDate(event) {
  const d = event?.eventDate ? new Date(event.eventDate) : null;
  if (!d || Number.isNaN(d.getTime())) return "Date TBA";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(s) {
  if (!s) return "";
  const v = String(s).toLowerCase();
  if (v === "upcoming") return "Upcoming";
  if (v === "ongoing") return "Ongoing";
  if (v === "completed") return "Completed";
  if (v === "cancelled") return "Cancelled";
  return s;
}

function EventLoaderBody({
  mode,
  activeEventId,
  onLoadEvent,
  loading,
  error,
  listLoading,
  listError,
  items,
}) {
  const [includePast, setIncludePast] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackId, setFallbackId] = useState(activeEventId || "");

  const filteredItems = useMemo(() => {
    const moderationSafe = mode === "leader" ? items.filter(isEventApproved) : items;
    if (includePast) return moderationSafe;
    return moderationSafe.filter((e) => {
      const s = (e.status || "").toLowerCase();
      return s === "upcoming" || s === "ongoing";
    });
  }, [includePast, items, mode]);

  const handleSelect = (e) => {
    const id = e.target.value?.trim() || "";
    if (!id || !onLoadEvent) return;
    onLoadEvent(id);
  };

  const handleFallbackSubmit = (ev) => {
    ev.preventDefault();
    const id = fallbackId.trim();
    if (!id || !onLoadEvent) return;
    onLoadEvent(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl bg-white dark:bg-[#161f2e] p-6 shadow-lg ring-1 ring-slate-100 dark:ring-slate-800"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Event Loader
          </p>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Select an event to load live attendance and participants.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-200">
          <CalendarSearch className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="event-select" className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Event
          </label>
          {listLoading ? (
            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-400">
              Loading events…
            </div>
          ) : listError ? (
            <div className="inline-flex w-full items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-700 ring-1 ring-amber-100 dark:bg-amber-900/30 dark:text-amber-100 dark:ring-amber-900/40">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{listError}</span>
            </div>
          ) : (
            <select
              id="event-select"
              name="event-select"
              value={activeEventId || ""}
              onChange={handleSelect}
              disabled={loading || filteredItems.length === 0}
              className="flex h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-9 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:bg-slate-900 dark:focus:ring-indigo-900/40"
              aria-label="Select an event"
            >
              <option value="">Select an event</option>
              {filteredItems.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title} — {formatEventDate(ev)} • {statusLabel(ev.status)}
                </option>
              ))}
            </select>
          )}
        </div>

        {!listLoading && !listError && filteredItems.length === 0 && items.length === 0 && (
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            No events found.{" "}
            <Link
              to={mode === "leader" ? "/leader/events" : "/admin/events/create"}
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {mode === "leader" ? "Create a club event" : "Create an event"}
            </Link>{" "}
            to track attendance.
          </p>
        )}

        {!listLoading && !listError && filteredItems.length === 0 && items.length > 0 && !includePast && (
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            No upcoming or ongoing events.{" "}
            <button
              type="button"
              onClick={() => setIncludePast(true)}
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Include past events
            </button>
          </p>
        )}

        <label htmlFor="event-loader-include-past" className="flex cursor-pointer items-center gap-2 text-[12px] text-slate-600 dark:text-slate-400">
          <input
            id="event-loader-include-past"
            name="event-loader-include-past"
            type="checkbox"
            checked={includePast}
            onChange={(e) => setIncludePast(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-[#2d3f55] dark:bg-[#161f2e]"
          />
          Include past events
        </label>

        {loading && activeEventId && (
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Loading event details and participants…
          </p>
        )}

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Once loaded, you’ll see the event banner, live stats, and the attendance table update
          automatically.
        </p>

        {error && (
          <div className="inline-flex w-full items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[11px] text-rose-700 ring-1 ring-rose-100 dark:bg-rose-900/30 dark:text-rose-100 dark:ring-rose-900/40">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="border-t border-slate-200 pt-3 dark:border-[#1e2d42]">
          <button
            type="button"
            onClick={() => setShowFallback(!showFallback)}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            {showFallback ? "Hide" : "Paste Event ID"} (fallback)
          </button>
          {showFallback && (
            <form onSubmit={handleFallbackSubmit} className="mt-2 flex gap-2">
              <input
                id="event-loader-fallback-id"
                name="event-loader-fallback-id"
                type="text"
                value={fallbackId}
                onChange={(e) => setFallbackId(e.target.value)}
                placeholder="e.g. 65f0c3e4d9c8b1a234567890"
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-400 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-50"
              />
              <button
                type="submit"
                disabled={!fallbackId.trim() || loading}
                className="rounded-lg bg-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-[#1e2d42] dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Load
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EventLoaderAdmin(props) {
  const {
    data: adminData,
    loading: adminLoading,
    error: adminError,
  } = useAdminEvents({
    status: "",
    limit: 50,
    sort: "eventDate_asc",
  });
  const items = adminData?.items ?? [];
  return (
    <EventLoaderBody
      {...props}
      mode="admin"
      listLoading={adminLoading}
      listError={adminError}
      items={items}
    />
  );
}

function EventLoaderLeader(props) {
  const { items: leaderItems, loading: leaderLoading, error: leaderError } = useLeaderEvents();
  return (
    <EventLoaderBody
      {...props}
      mode="leader"
      listLoading={leaderLoading}
      listError={leaderError}
      items={leaderItems}
    />
  );
}

export default function EventLoader({ mode = "admin", ...rest }) {
  if (mode === "leader") {
    return <EventLoaderLeader {...rest} />;
  }
  return <EventLoaderAdmin {...rest} />;
}
