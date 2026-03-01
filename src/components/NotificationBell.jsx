import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ClipboardList,
  Rocket,
  TrendingUp,
  UserPlus,
  Mail,
} from "lucide-react";
import api from "../api/client";

const TYPE_CONFIG = {
  application_status: { icon: ClipboardList, bg: "bg-slate-500", label: "application" },
  new_drive: { icon: Rocket, bg: "bg-blue-500", label: "drive" },
  role_change: { icon: TrendingUp, bg: "bg-purple-500", label: "role" },
  new_application: { icon: UserPlus, bg: "bg-green-500", label: "application" },
  email_received: { icon: Mail, bg: "bg-amber-500", label: "email" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diffSec = (Date.now() - d.getTime()) / 1000;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 172800) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [bellRing, setBellRing] = useState(false);
  const [badgeBounce, setBadgeBounce] = useState(false);
  const ref = useRef(null);
  const prevCountRef = useRef(null);
  const isInitialMount = useRef(true);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/user-notifications");
      if (res.data?.success) setList(res.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get("/api/user-notifications/unread-count");
      if (res.data?.success) {
        const count = res.data.data?.count ?? 0;
        const prev = prevCountRef.current;
        prevCountRef.current = count;
        setUnreadCount(count);
        if (!isInitialMount.current && prev != null && count > prev) {
          const added = count - prev;
          setBellRing(true);
          setBadgeBounce(true);
          setToast({ message: `You have ${added} new notification${added > 1 ? "s" : ""}`, key: Date.now() });
          setTimeout(() => setBellRing(false), 400);
          setTimeout(() => setBadgeBounce(false), 350);
          setTimeout(() => setToast(null), 3000);
        }
        isInitialMount.current = false;
        return count;
      }
    } catch {
      // ignore
    }
    return unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await api.patch(`/api/user-notifications/${id}/read`);
      setList((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    try {
      await api.patch("/api/user-notifications/read-all");
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      fetchList();
    }
  }, [fetchList, unreadCount]);

  const handleNotificationClick = useCallback(
    (n) => {
      if (!n.isRead) markRead(n._id);
      setOpen(false);
      if (n.link) navigate(n.link);
    },
    [markRead, navigate]
  );

  const panelContent = (
    <>
      {/* Header — sticky */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className={`text-xs transition-colors ${
            unreadCount > 0
              ? "cursor-pointer text-blue-600 hover:underline"
              : "cursor-default text-slate-400"
          }`}
        >
          Mark all read
        </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 border-b border-slate-50 px-4 py-3.5">
                <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 animate-pulse" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
                  <div className="mt-2 h-3 w-full rounded bg-slate-100 animate-pulse" />
                </div>
                <div className="h-3 w-10 shrink-0 rounded bg-slate-100 animate-pulse" />
              </div>
            ))}
          </>
        )}
        {!loading && list.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
              <Bell className="h-8 w-8 text-slate-400" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-600">All caught up!</p>
            <p className="mt-1 text-xs text-slate-400">No new notifications</p>
          </div>
        )}
        {!loading &&
          list.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.application_status;
            const Icon = config.icon;
            return (
              <button
                key={n._id}
                type="button"
                onClick={() => handleNotificationClick(n)}
                className={`flex w-full cursor-pointer items-start gap-3 border-b border-slate-50 px-4 py-3.5 text-left transition-[background] duration-150 ${
                  n.isRead
                    ? "bg-white hover:bg-slate-50"
                    : "bg-blue-50/40 hover:bg-blue-50/60"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bg} text-white`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-slate-900">{n.title}</p>
                  {n.message && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {timeAgo(n.createdAt)}
                  </span>
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </div>
              </button>
            );
          })}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => { setOpen(false); navigate("/notifications"); }}
          className="text-xs text-blue-600 hover:underline"
        >
          View all notifications
        </button>
      </div>
    </>
  );

  return (
    <div className="relative" ref={ref} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Bell trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell
          className={`h-5 w-5 transition-transform duration-75 ${bellRing ? "animate-bell-ring" : ""}`}
        />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white ${
              badgeBounce ? "animate-badge-bounce" : ""
            }`}
            key={unreadCount}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel — desktop */}
      {open && !isMobile && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-[480px] w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] animate-notification-panel"
          style={{ transformOrigin: "top right" }}
        >
          {panelContent}
        </div>
      )}

      {/* Bottom sheet — mobile */}
      {open && isMobile && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl border border-b-0 border-slate-200 bg-white shadow-xl animate-slide-up"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <div className="flex items-center justify-center border-b border-slate-100 py-2">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>
            {panelContent}
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[100] rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-lg"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", animation: "toastFadeIn 200ms ease-out" }}
        >
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes toastFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes notificationBadge {
          0% { transform: scale(0); }
          70% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes notificationPanel {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        .animate-badge-bounce {
          animation: notificationBadge 300ms ease-out;
        }
        .animate-bell-ring {
          animation: bellRing 400ms ease-in-out 3;
        }
        .animate-notification-panel {
          animation: notificationPanel 150ms ease-out;
        }
        .animate-slide-up {
          animation: slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
