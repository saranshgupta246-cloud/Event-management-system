import React, { useState } from "react";
import useEventChat from "../../hooks/useEventChat";
import { useAuth } from "../../context/AuthContext";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(role) {
  if (role === "admin") return "Admin";
  if (role === "faculty_coordinator") return "Faculty Coordinator";
  if (role === "faculty") return "Faculty";
  return null;
}

export default function EventChatRoom({ event, hideHeader = false }) {
  const eventId = event?._id;
  const {
    messages,
    loading,
    sendMessage,
    deleteMessage,
    chatMode,
    canSend,
    canModerate,
    updateChatMode,
  } = useEventChat(eventId);
  const [draft, setDraft] = useState("");
  const { user } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {!hideHeader && (
        <div className="bg-white dark:bg-background-dark border-b border-slate-200 dark:border-[#1e2d42] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-slate-50 text-[22px] font-bold leading-tight tracking-[-0.015em]">
              {event?.title || "Event chat"}
            </h2>
            <div className="flex gap-3 pt-2">
              <div className="flex h-7 items-center justify-center gap-x-1.5 rounded-full bg-primary/10 px-3 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-lg">
                  check_circle
                </span>
                <p className="text-primary text-xs font-bold uppercase tracking-wider">
                  Registered
                </p>
              </div>
            </div>
          </div>
          {canModerate && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Chat mode
              </span>
              <div className="inline-flex rounded-full bg-slate-100 dark:bg-[#161f2e] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => updateChatMode("leaders_only")}
                  className={`px-3 py-1 rounded-full font-semibold ${
                    chatMode === "leaders_only"
                      ? "bg-white dark:bg-[#161f2e] text-primary shadow-sm"
                      : "text-slate-500 dark:text-slate-300"
                  }`}
                >
                  Leaders only
                </button>
                <button
                  type="button"
                  onClick={() => updateChatMode("everyone")}
                  className={`px-3 py-1 rounded-full font-semibold ${
                    chatMode === "everyone"
                      ? "bg-white dark:bg-[#161f2e] text-primary shadow-sm"
                      : "text-slate-500 dark:text-slate-300"
                  }`}
                >
                  Everyone
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
        {loading && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading chat...
          </p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
                {canSend
                  ? "No messages yet – say hi."
                  : "No messages yet. Chat is currently read-only for participants."}
          </p>
        )}
        {!loading &&
          messages.map((msg) => {
            const senderId = msg.sender?._id || msg.sender?.id;
            const currentId = user?._id;
            const isMe = Boolean(senderId && currentId && senderId === currentId);
            const timeLabel = formatTime(msg.createdAt);
            const badge = !isMe ? roleLabel(msg.sender?.role) : null;
            const avatarUrl =
              msg.sender?.avatar ||
              msg.sender?.avatar_url ||
              (isMe ? user?.avatar || user?.avatar_url : null);
            const initial = (msg.sender?.name || user?.name || "U")
              .trim()
              .charAt(0)
              .toUpperCase();

            return (
              <div
                key={msg._id}
                className={`group flex gap-3 max-w-[85%] relative ${
                  isMe ? "self-end flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`size-9 rounded-full bg-slate-300 dark:bg-[#1e2d42] flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-100 bg-cover bg-center ${
                    avatarUrl ? "" : "uppercase"
                  }`}
                  style={
                    avatarUrl
                      ? {
                          backgroundImage: `url("${avatarUrl}")`,
                        }
                      : undefined
                  }
                >
                  {!avatarUrl && initial}
                </div>
                <div className={`flex flex-col ${isMe ? "items-end" : ""}`}>
                  <div className="flex items-center gap-2 text-[11px]">
                    {isMe ? (
                      <span className="font-semibold text-slate-700 dark:text-slate-100">
                        You
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-700 dark:text-slate-100">
                        {msg.sender?.name || "User"}
                      </span>
                    )}
                    {badge && (
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                        {badge}
                      </span>
                    )}
                    {timeLabel && (
                      <span className="text-[10px] text-slate-400">{timeLabel}</span>
                    )}
                  </div>
                  <div
                    className={`mt-1 rounded-lg text-sm leading-relaxed ${
                      isMe
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-white dark:bg-background-dark border border-slate-200 dark:border-[#1e2d42] rounded-tl-none"
                    } p-3`}
                  >
                    {msg.message}
                  </div>
                </div>
                {canModerate && (
                  <button
                    type="button"
                    onClick={() => {
                      // simple confirm to avoid accidental deletions
                      if (window.confirm("Delete this message for everyone?")) {
                        deleteMessage(msg._id);
                      }
                    }}
                    className="absolute -top-1.5 group-hover:flex hidden right-0 translate-y-[-50%] items-center justify-center rounded-md bg-white dark:bg-[#161f2e] border border-slate-200 dark:border-[#1e2d42] p-1 text-slate-400 hover:text-rose-500"
                    title="Delete message"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Chat Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-[#1e2d42]"
      >
        <div className="flex items-center gap-3">
          <textarea
            id={eventId ? `event-chat-draft-${eventId}` : "event-chat-draft"}
            name={eventId ? `event-chat-draft-${eventId}` : "event-chat-draft"}
            className="form-input block w-full rounded-xl border border-slate-300 dark:border-[#1e2d42] bg-slate-50 dark:bg-[#161f2e] text-slate-900 dark:text-slate-50 focus:ring-primary focus:border-primary placeholder:text-slate-500 px-3 py-3 resize-none min-h-[44px]"
            placeholder={
              canSend
                ? "Ask a question or find a teammate..."
                : chatMode === "leaders_only"
                ? "Chat is read-only. Only organizers can send messages."
                : "You cannot send messages in this chat."
            }
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!canSend}
          />
          <button
            type="submit"
            className="flex items-center justify-center size-10 bg-primary text-white rounded-lg hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-60"
            disabled={!canSend || !draft.trim()}
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </form>
    </div>
  );
}

