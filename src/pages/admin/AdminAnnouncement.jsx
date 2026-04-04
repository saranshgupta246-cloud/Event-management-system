import React, { useState } from "react";
import { useNotifications } from "../../context/NotificationContext";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "students", label: "Students Only" },
  { value: "faculty", label: "Faculty Only" },
  { value: "club_leaders", label: "Club Leaders" },
];

export default function AdminAnnouncement() {
  const { notifications, addNotification, refetch, deleteNotification } = useNotifications();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [expiresAt, setExpiresAt] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id) => {
    if (!id) {
      showToast("Unable to delete this announcement.");
      return;
    }
    try {
      await deleteNotification(id);
      showToast("Announcement deleted.");
      await refetch?.();
    } catch {
      // deleteNotification already rolls back on error
      showToast("Failed to delete. Please try again.");
    }
  };

  const handleBroadcast = async (pinned = false) => {
    const t = (title || "").trim();
    const m = (message || "").trim();
    if (!t && !m) {
      showToast("Add a title or message.");
      return;
    }
    let expires = expiresAt || null;
    await addNotification({
      title: t || "Announcement",
      message: m,
      audience,
      pinned,
      expiresAt: expires,
    });
    setTitle("");
    setMessage("");
    setExpiresAt("");
    showToast(pinned ? "Pinned and sent." : "Broadcast sent.");
  };

  const handleSaveDraft = () => {
    const t = (title || "").trim();
    const m = (message || "").trim();
    if (!t && !m) {
      showToast("Add a title or message to save.");
      return;
    }
    setDrafts((prev) => [...prev, { id: Date.now(), title: t || "Untitled", message: m, audience }]);
    setLastSaved(new Date());
    showToast("Draft saved.");
  };

  const handleDiscard = () => {
    setTitle("");
    setMessage("");
    setLastSaved(null);
    showToast("Discarded.");
  };

  const [filter, setFilter] = useState("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "pinned") return !!n.pinned;
    if (filter === "unpinned") return !n.pinned;
    return true;
  });

  const list = [...filteredNotifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium shadow-lg animate-in fade-in">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Announcements</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Pin or broadcast a message to the campus. No separate create page — compose here.
      </p>

      {/* Inline pin-message composer */}
      <div className="bg-white dark:bg-[#161f2e] rounded-xl border border-slate-200 dark:border-[#1e2d42] shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-200 dark:border-[#1e2d42] bg-slate-50/50 dark:bg-[#161f2e]/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Compose
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="announcement-title" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Announcement title</label>
            <input
              id="announcement-title"
              name="announcement-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#2d3f55] bg-white dark:bg-[#161f2e] px-4 py-2 text-slate-900 dark:text-white placeholder:text-slate-400"
              placeholder="e.g. Spring Gala Tickets Live"
            />
          </div>
          <div>
            <label htmlFor="announcement-message" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Message body</label>
            <textarea
              id="announcement-message"
              name="announcement-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#2d3f55] bg-white dark:bg-[#161f2e] px-4 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 resize-y min-h-[120px]"
              placeholder="Type your message..."
            />
          </div>
          <div>
            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Target audience</span>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`announcement-audience-${opt.value}`}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
                    audience === opt.value
                      ? "border-primary bg-primary text-white shadow-md ring-2 ring-primary/40 dark:ring-primary/50"
                      : "border-slate-200 bg-white text-slate-800 dark:border-[#2d3f55] dark:bg-[#161f2e]/80 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500"
                  }`}
                >
                  <input
                    type="radio"
                    id={`announcement-audience-${opt.value}`}
                    name="audience"
                    value={opt.value}
                    checked={audience === opt.value}
                    onChange={() => setAudience(opt.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Targeting:</span>{" "}
              {AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? audience}
            </p>
          </div>
          <div>
            <label htmlFor="announcement-expires-at" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Expiry (for unpinned announcements)
            </label>
            <input
              id="announcement-expires-at"
              name="announcement-expires-at"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-[#2d3f55] bg-white dark:bg-[#161f2e] px-4 py-2 text-sm text-slate-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Optional. After this time, unpinned announcements disappear automatically. Pinned announcements ignore expiry.
            </p>
          </div>
        </div>
        <div className="px-4 py-3 bg-slate-50 dark:bg-[#161f2e]/50 border-t border-slate-200 dark:border-[#1e2d42] min-w-0">
          <div
            className="flex flex-nowrap sm:flex-wrap sm:items-center sm:justify-between gap-2 overflow-x-auto overscroll-x-contain pb-1 sm:overflow-visible sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 [scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent] dark:[scrollbar-color:rgb(51_65_85)_transparent]"
            role="toolbar"
            aria-label="Composer actions"
          >
            <div className="flex flex-nowrap items-center gap-2 shrink-0 sm:flex-wrap sm:min-w-0">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-lg leading-none" aria-hidden>
                  visibility
                </span>
                {previewMode ? "Hide preview" : "Preview"}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-primary bg-white px-3 py-2.5 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-primary dark:bg-[#161f2e] dark:text-primary dark:hover:bg-primary/10 whitespace-nowrap"
              >
                Save as Draft
              </button>
            </div>
            <div className="hidden sm:block h-8 w-px shrink-0 self-center bg-slate-200 dark:bg-[#2d3f55] sm:mx-1" aria-hidden />
            <div className="flex flex-nowrap items-center gap-2 shrink-0 sm:ml-0">
              <button
                type="button"
                onClick={() => handleBroadcast(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:border-[#2d3f55] dark:bg-[#243652] dark:hover:bg-[#2d4055] whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-lg leading-none" aria-hidden>
                  push_pin
                </span>
                Pin
              </button>
              <button
                type="button"
                onClick={() => handleBroadcast(false)}
                className="btn-primary inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-lg leading-none" aria-hidden>
                  send
                </span>
                Broadcast now
              </button>
            </div>
          </div>
        </div>
        {lastSaved && (
          <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#1e2d42] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">save</span>
            Draft saved {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      {previewMode && (
        <div className="mb-8 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-[#2d3f55] bg-slate-50 dark:bg-[#161f2e]/50">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Preview</h3>
          <div className="bg-white dark:bg-[#161f2e] rounded-lg p-4 border border-slate-200 dark:border-[#1e2d42]">
            <p className="font-semibold text-slate-900 dark:text-white">{title || "Announcement title"}</p>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 whitespace-pre-wrap">{message || "Message body..."}</p>
            <p className="text-xs text-slate-400 mt-2">Audience: {AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? audience}</p>
          </div>
        </div>
      )}

      {/* List of sent/pinned */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Sent &amp; pinned</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            { value: "all", label: "All" },
            { value: "pinned", label: "Pinned" },
            { value: "unpinned", label: "Unpinned" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                filter === opt.value
                  ? "btn-primary text-white border-transparent dark:bg-primary dark:border-primary"
                  : "bg-slate-50 text-slate-600 dark:bg-[#161f2e] dark:text-slate-200 border-slate-200 dark:border-[#1e2d42]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">No announcements yet. Use the composer above to send or pin.</p>
        ) : (
          <ul className="space-y-3">
            {list.map((n) => (
              <li
                key={n._id || n.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-[#1e2d42] bg-white dark:bg-[#161f2e] hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{n.title}</h3>
                      {n.pinned && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          Pinned
                        </span>
                      )}
                      {!n.pinned && n.expiresAt && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-[#1e2d42] dark:text-slate-200">
                          Expires:{" "}
                          {new Date(n.expiresAt).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-[#1e2d42] dark:text-slate-200">
                        Audience: {n.audience}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : ""}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">
                      {n.message}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setTitle(n.title || "");
                        setMessage(n.message || "");
                        setAudience(n.audience || "all");
                        setExpiresAt(
                          n.expiresAt ? new Date(n.expiresAt).toISOString().slice(0, 16) : ""
                        );
                        showToast("Loaded into composer. You can edit and resend.");
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-[#2d3f55] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Duplicate
                    </button>
                    {n._id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(n._id)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {drafts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Drafts</h2>
          <ul className="space-y-2">
            {drafts.map((d) => (
              <li key={d.id} className="p-3 rounded-lg bg-slate-100 dark:bg-[#161f2e]/50 border border-slate-200 dark:border-[#1e2d42]">
                <p className="font-medium text-slate-800 dark:text-slate-200">{d.title}</p>
                <p className="text-xs text-slate-500 line-clamp-1">{d.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
