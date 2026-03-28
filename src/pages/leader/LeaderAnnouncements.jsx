import React, { useState } from "react";
import { Megaphone } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

export default function LeaderAnnouncements() {
  const { getNotificationsForUser, addNotification } = useNotifications();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSend = (pinned = false) => {
    const t = (title || "").trim();
    const m = (message || "").trim();
    if (!t && !m) {
      showToast("Add a title or message.");
      return;
    }
    addNotification({
      title: t || "Club announcement",
      message: m,
      audience: "club_leaders",
      pinned,
    });
    setTitle("");
    setMessage("");
    showToast(pinned ? "Pinned and sent." : "Announcement sent.");
  };

  const list = getNotificationsForUser("club_leaders");

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Announcements</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Send or pin a message to your club / club leaders. Compose below.
      </p>

      {/* Inline composer (compact) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1e2d42] dark:bg-[#161f2e] mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Megaphone className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">New announcement</h3>
        </div>
        <div className="space-y-4">
          <input
            id="leader-announcement-title"
            name="leader-announcement-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
          />
          <textarea
            id="leader-announcement-message"
            name="leader-announcement-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message to club / leaders..."
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSend(true)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#1e2d42] hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Pin
            </button>
            <button
              type="button"
              onClick={() => handleSend(false)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Sent announcements</h3>
        {list.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {list.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1e2d42] dark:bg-[#161f2e]"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{n.title}</h4>
                      {n.pinned && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : ""}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{n.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
