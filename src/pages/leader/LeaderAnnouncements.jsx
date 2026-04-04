import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Megaphone, Trash2 } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function formatAudienceLabel(audience) {
  const a = String(audience || "all");
  if (a === "club_leaders") return "Club";
  if (a === "students") return "Students";
  if (a === "faculty") return "Faculty";
  if (a === "all") return "Everyone";
  return a;
}

function formatTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}

export default function LeaderAnnouncements() {
  const { user } = useAuth();
  const userId = user?._id ? String(user._id) : "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState("");
  const [toast, setToast] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const loadAnnouncements = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/api/notifications", {
        params: { audience: "club" },
      });
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      const mine = raw.filter((n) => {
        const byMe = String(n.createdBy || "") === userId;
        const clubAudience =
          n.audience === "club_leaders" || n.audience === "club";
        return byMe && clubAudience;
      });
      setItems(mine);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const send = async (pinned) => {
    const t = (title || "").trim();
    const m = (message || "").trim();
    if (!t) {
      setPostError("Title is required.");
      return;
    }
    setPostError("");
    setSubmitting(true);
    try {
      const res = await api.post("/api/notifications", {
        title: t,
        message: m,
        audience: "club_leaders",
        pinned: !!pinned,
      });
      if (res.data?.success && res.data?.data) {
        const created = res.data.data;
        setItems((prev) => [
          created,
          ...prev.filter((p) => String(p._id) !== String(created._id)),
        ]);
        setTitle("");
        setMessage("");
        showToast("Announcement sent");
      } else {
        setPostError(res.data?.message || "Failed to send — try again");
      }
    } catch (e) {
      setPostError(
        e.response?.data?.message || "Failed to send — try again"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/notifications/${id}`);
      setItems((prev) => prev.filter((n) => String(n._id) !== String(id)));
      setDeleteConfirmId(null);
      showToast("Announcement removed");
    } catch (e) {
      showToast(e.response?.data?.message || "Could not delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#0d1117] sm:px-6 md:px-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {toast && (
          <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg dark:bg-[#161f2e] dark:ring-1 dark:ring-[#1e2d42]">
            {toast}
          </div>
        )}

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Announcements
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Post updates for your club. They appear in the notification center for the right
          audience.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Compose</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="leader-announcement-title"
                className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Title
              </label>
              <input
                id="leader-announcement-title"
                name="leader-announcement-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short headline"
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25 disabled:opacity-60 dark:border-[#1e2d42] dark:bg-[#0d1117] dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="leader-announcement-message"
                className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Message
              </label>
              <textarea
                id="leader-announcement-message"
                name="leader-announcement-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Details for your club…"
                rows={4}
                disabled={submitting}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25 disabled:opacity-60 dark:border-[#1e2d42] dark:bg-[#0d1117] dark:text-white"
              />
            </div>
            {postError && (
              <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">
                {postError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => send(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-[#1e2d42] dark:bg-[#0d1117] dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Pin &amp; Send
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => send(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send
              </button>
            </div>
          </div>
        </div>

        <h2 className="mb-4 mt-10 text-lg font-bold text-slate-900 dark:text-white">
          Sent announcements
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1e2d42] dark:bg-[#161f2e]"
              >
                <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-[#1e2d42]" />
                <div className="mt-3 h-3 w-full rounded bg-slate-100 dark:bg-[#0d1117]" />
                <div className="mt-2 h-3 w-4/5 rounded bg-slate-100 dark:bg-[#0d1117]" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-400">
            No announcements yet. Send one above to reach your club.
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((n) => {
              const id = String(n._id);
              const confirming = deleteConfirmId === id;
              return (
                <li
                  key={id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]"
                >
                  <div className="relative p-5">
                    {!confirming && (
                      <button
                        type="button"
                        aria-label="Delete announcement"
                        disabled={deletingId === id}
                        onClick={() => setDeleteConfirmId(id)}
                        className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-[#0d1117] dark:hover:text-rose-400"
                      >
                        {deletingId === id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <div className="pr-12">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{n.title}</h3>
                        {n.pinned && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                            Pinned
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                        {formatTimestamp(n.createdAt)}{" "}
                        <span className="text-slate-400">·</span>{" "}
                        <span className="text-slate-600 dark:text-slate-400">
                          {formatAudienceLabel(n.audience)}
                        </span>
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {n.message || "—"}
                      </p>
                    </div>
                  </div>
                  {confirming && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 dark:border-[#1e2d42] dark:bg-[#0d1117]">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Delete this?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-200 dark:hover:bg-[#1e2d42]"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                          disabled={deletingId === id}
                          onClick={() => confirmDelete(id)}
                        >
                          {deletingId === id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Yes"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
