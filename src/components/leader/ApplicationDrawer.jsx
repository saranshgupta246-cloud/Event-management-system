import React, { useState, useCallback, useEffect } from "react";
import {
  X,
  ChevronDown,
  Star,
  Send,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import api from "../../services/api";

const STATUS_META = {
  pending: { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
  shortlisted: { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  interview: { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
  selected: { bg: "#F0FDF4", text: "#14532D", dot: "#22C55E" },
  rejected: { bg: "#FFF1F2", text: "#881337", dot: "#F43F5E" },
  withdrawn: { bg: "#F8FAFC", text: "#475569", dot: "#94A3B8" },
};

const STATUS_OPTIONS = ["pending", "shortlisted", "interview", "selected", "rejected"];

function hashToHue(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h % 360);
}

function formatDate(d) {
  if (!d) return "â€”";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelative(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(d);
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: meta.bg, color: meta.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
      {(status && status.charAt(0).toUpperCase() + status.slice(1)) || "â€”"}
    </span>
  );
}

export default function ApplicationDrawer({ application, onClose, onRefresh, onOpenEmail }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [notes, setNotes] = useState(application?.reviewNotes ?? "");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingRating, setUpdatingRating] = useState(false);

  useEffect(() => {
    setNotes(application?.reviewNotes ?? "");
  }, [application?._id, application?.reviewNotes]);

  const saveNotes = useCallback(async () => {
    if (!application?._id) return;
    setNotesSaving(true);
    setNotesSaved(false);
    try {
      await api.patch(`/api/applications/${application._id}/rating`, { reviewNotes: notes });
      setNotesSaved(true);
      onRefresh?.();
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setNotesSaving(false);
    }
  }, [application?._id, notes, onRefresh]);

  const handleStatusChange = useCallback(
    async (newStatus) => {
      if (!application?._id || newStatus === application.status) return;
      setStatusDropdownOpen(false);
      setUpdatingStatus(true);
      try {
        await api.patch(`/api/applications/${application._id}/status`, { status: newStatus });
        onRefresh?.();
      } catch {
        // ignore
      } finally {
        setUpdatingStatus(false);
      }
    },
    [application?._id, application?.status, onRefresh]
  );

  const handleRatingChange = useCallback(
    async (rating) => {
      if (!application?._id) return;
      setUpdatingRating(true);
      try {
        await api.patch(`/api/applications/${application._id}/rating`, { rating });
        onRefresh?.();
      } catch {
        // ignore
      } finally {
        setUpdatingRating(false);
      }
    },
    [application?._id, onRefresh]
  );

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="mt-4 text-sm">Loading application...</p>
      </div>
    );
  }

  const applicant = application.applicantId || {};
  const name = applicant.name || "Applicant";
  const email = applicant.email || "";
  const enrollmentId = application.enrollmentId || applicant.studentId || "â€”";
  const hue = hashToHue(name);
  const avatarBg = `hsl(${hue}, 55%, 45%)`;
  const drive = application.driveId || {};
  const customQuestions = drive.customQuestions || [];
  const answersMap = {};
  const answerMetaById = {};
  (application.answers || []).forEach((a) => {
    const id = (a.questionId || "").toString();
    if (id) {
      answersMap[id] = a.value !== undefined && a.value !== null ? a.value : a.answer;
      answerMetaById[id] = a;
    }
  });
  const statusHistory = (application.statusHistory || []).slice().reverse();
  const emailLogs = application.emailLogs || [];

  return (
    <>
      <div className="flex-shrink-0 border-b border-slate-100 px-5 pb-4 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: avatarBg }}
          >
            {(name || "A").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold tracking-tight text-slate-900">{name}</h2>
            <p className="truncate text-sm text-slate-500">{email}</p>
            <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {enrollmentId}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setStatusDropdownOpen((b) => !b)}
              disabled={updatingStatus}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: STATUS_META[application.status]?.bg || "#F1F5F9",
                color: STATUS_META[application.status]?.text || "#475569",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_META[application.status]?.dot || "#94A3B8" }} />
              {(application.status && application.status.charAt(0).toUpperCase() + application.status.slice(1)) || "Status"}
              <ChevronDown className="h-4 w-4" />
            </button>
            {statusDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setStatusDropdownOpen(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <StatusPill status={s} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRatingChange(r)}
                disabled={updatingRating}
                className="p-0.5"
              >
                <Star
                  className={`h-4 w-4 transition-colors ${
                    (application.rating || 0) >= r ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-200"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenEmail}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Send className="h-4 w-4" />
            Send Email
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 border-b border-slate-200">
        <div className="flex gap-6 px-5">
          {[
            { id: "profile", label: "Profile & Answers" },
            { id: "timeline", label: "Timeline" },
            { id: "emails", label: "Emails" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {activeTab === "profile" && (
          <div className="space-y-6">
            {(application.resumeUrl || application.portfolioUrl) && (
              <div className="flex flex-wrap gap-2">
                {application.resumeUrl && (
                  <a
                    href={application.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4" />
                    Resume
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {application.portfolioUrl && (
                  <a
                    href={application.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Portfolio
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
            <div>
              <label htmlFor={application?._id ? `application-notes-${application._id}` : "application-notes"} className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Internal Notes
              </label>
              <textarea
                id={application?._id ? `application-notes-${application._id}` : "application-notes"}
                name={application?._id ? `application-notes-${application._id}` : "application-notes"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                disabled={notesSaving}
                placeholder="Private notes about this applicant..."
                rows={4}
                className="w-full resize-none rounded-xl border-0 bg-slate-50 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20"
              />
              {notesSaving && <p className="mt-1 text-xs text-slate-400">Saving...</p>}
              {notesSaved && (
                <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                  <Check className="h-3 w-3" /> Saved
                </p>
              )}
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Application Answers</h3>
              <div className="space-y-3">
                {customQuestions.length === 0 && (application.answers || []).length === 0 && (
                  <p className="text-sm text-slate-500">No answers recorded.</p>
                )}
                {customQuestions.map((q) => {
                  const qId = (q.questionId || q._id || "").toString();
                  const val = answersMap[qId];
                  const display =
                    val === undefined || val === null
                      ? "â€”"
                      : Array.isArray(val)
                        ? val.join(", ")
                        : String(val);
                  const title = answerMetaById[qId]?.fieldLabel || q.label || "Question";
                  return (
                    <div key={qId} className="rounded-lg bg-slate-50 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
                      <p className="whitespace-pre-wrap text-sm text-slate-800">{display}</p>
                    </div>
                  );
                })}
                {customQuestions.length === 0 &&
                  (application.answers || []).map((a, i) => {
                    const raw = a.value !== undefined && a.value !== null ? a.value : a.answer;
                    const text = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "â€”");
                    return (
                      <div key={i} className="rounded-lg bg-slate-50 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {a.fieldLabel || `Answer ${i + 1}`}
                        </p>
                        <p className="text-sm text-slate-800">{text}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="relative ml-3">
            <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-slate-100" />
            <div className="space-y-4">
              {statusHistory.length === 0 && (
                <p className="text-sm text-slate-500">No status changes yet.</p>
              )}
              {statusHistory.map((entry, i) => {
                const by = entry.changedBy?.name || "Someone";
                return (
                  <div key={i} className="relative flex gap-3">
                    <div
                      className="relative z-10 mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 border-white ring-2"
                      style={{
                        backgroundColor: STATUS_META[entry.toStatus]?.dot || "#94A3B8",
                        ringColor: `${STATUS_META[entry.toStatus]?.dot || "#94A3B8"}33`,
                      }}
                    />
                    <div className="flex-1 pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill status={entry.fromStatus} />
                        <span className="text-slate-400">â†’</span>
                        <StatusPill status={entry.toStatus} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        by {by} Â· {formatRelative(entry.changedAt)}
                      </p>
                      {entry.note && (
                        <p className="ml-0 mt-1 text-sm italic text-slate-500">{entry.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "emails" && (
          <div className="space-y-3">
            {emailLogs.length === 0 && (
              <p className="text-sm text-slate-500">No emails sent yet.</p>
            )}
            {emailLogs.map((log) => (
              <div
                key={log._id}
                className="rounded-2xl rounded-tl-none bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-800">{log.subject}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {formatDate(log.sentAt)} Â· {log.templateUsed || "Custom"}
                </p>
                <div
                  className="mt-1 line-clamp-2 text-sm text-slate-600"
                  dangerouslySetInnerHTML={{ __html: (log.body || "").replace(/<[^>]+>/g, " ").slice(0, 200) + "..." }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
