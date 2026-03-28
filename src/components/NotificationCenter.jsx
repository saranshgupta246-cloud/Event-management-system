import React, { useEffect, useRef, useState } from "react";
import { Award, Bell, BellDot, Check, CheckCheck, Pin, Trash2, X } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const ref = useRef(null);
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered =
    tab === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellDot className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[360px] max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1e2d42] dark:bg-[#161f2e] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2d42] px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
                  title="Mark all read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-[#1e2d42]">
            {["all", "unread"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${
                  tab === t
                    ? "border-b-2 border-primary text-primary"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {t === "unread" ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` : "All"}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading && (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                Loading...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                <Bell className="h-8 w-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                {tab === "unread" ? "No unread notifications" : "No notifications yet"}
              </div>
            )}
            {filtered.map((n) => (
              <div
                key={n._id}
                role="button"
                tabIndex={0}
                onClick={() => { if (!n.isRead) markRead(n._id); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !n.isRead) markRead(n._id); }}
                className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  n.isRead
                    ? "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    : n.type === "certificate_ready"
                    ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
                    : "bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                      n.type === "certificate_ready"
                        ? "bg-amber-500 text-white"
                        : n.pinned
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {n.type === "certificate_ready" ? (
                      <Award className="h-3.5 w-3.5" />
                    ) : n.pinned ? (
                      <Pin className="h-3.5 w-3.5" />
                    ) : (
                      <Bell className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-semibold truncate ${n.isRead ? "text-slate-700 dark:text-slate-200" : "text-slate-900 dark:text-white"}`}>
                      {n.title}
                      {n.pinned && (
                        <span className="ml-1.5 inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          PINNED
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  {n.message && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {timeAgo(n.createdAt)} · {n.audience}
                    </p>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); markRead(n._id); }}
                        className="hidden group-hover:flex items-center gap-1 text-[10px] text-primary hover:underline"
                      >
                        <Check className="h-3 w-3" /> Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
