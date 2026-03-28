import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Check, ChevronDown, ClipboardList, AlertCircle } from "lucide-react";
import { useMyApplications } from "../../hooks/useMyApplications";
import api from "../../api/client";
import { resolveEventImageUrl } from "../../utils/eventUrls";
import { STATUS_META } from "../../config/statusTokens";

const STATUS_TABS = [
  { id: "", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interview" },
  { id: "selected", label: "Selected" },
  { id: "rejected", label: "Rejected" },
];

const PIPELINE_STEPS = ["Applied", "Shortlisted", "Interview", "Selected"];
const STATUS_TO_STEP = { pending: 0, shortlisted: 1, interview: 2, selected: 3, rejected: 0, withdrawn: -1 };

function hashToHue(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h % 360);
}

function formatDate(d) {
  if (!d) return "—";
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
      {(status && status.charAt(0).toUpperCase() + status.slice(1)) || "—"}
    </span>
  );
}

function ApplicationCard({ app, expanded, onToggle, fullApp, loadingFull, onRefetch }) {
  const drive = app.driveId || {};
  const club = app.clubId || {};
  const clubName = club.name || "Club";
  const logoUrl = club.logoUrl;
  const hue = hashToHue(clubName);
  const initials = clubName.slice(0, 2).toUpperCase();
  const roleTitle = drive.roleTitle || "Role";
  const status = app.status || "pending";
  const stepIndex = STATUS_TO_STEP[status] ?? 0;
  const isRejected = status === "rejected";

  const [withdrawConfirm, setWithdrawConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const handleWithdraw = useCallback(async () => {
    if (app.status !== "pending") return;
    setWithdrawing(true);
    try {
      await api.patch(`/api/applications/${app._id}/status`, { status: "withdrawn" });
      setWithdrawConfirm(false);
      onRefetch?.();
    } catch {
      // ignore
    } finally {
      setWithdrawing(false);
    }
  }, [app._id, app.status, onRefetch]);

  return (
    <div
      className="mb-3 cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md"
      onClick={() => onToggle(app._id)}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
          style={{ backgroundColor: logoUrl ? "transparent" : `hsl(${hue}, 55%, 45%)` }}
        >
          {logoUrl ? (
            <img src={resolveEventImageUrl(logoUrl)} alt="" className="h-full w-full rounded-xl object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-900">{roleTitle}</p>
          <p className="text-sm text-slate-500">{clubName}</p>
          <p className="mt-0.5 text-xs text-slate-400">Applied {formatDate(app.createdAt)}</p>
        </div>
        <div className="ml-auto flex flex-shrink-0 items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <StatusPill status={status} />
          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Status pipeline - always visible */}
      <div className="mt-4">
        <div className="flex items-center">
          {PIPELINE_STEPS.map((label, i) => {
            const completed = stepIndex > i || (stepIndex === i && ["selected", "shortlisted", "interview"].includes(status));
            const current = stepIndex === i && status !== "withdrawn" && !completed;
            const isPast = i < stepIndex && !isRejected;
            const isRed = isRejected && stepIndex >= 0 && i <= stepIndex;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                      completed ? "bg-blue-500 text-white" : current ? "border-2 border-blue-500 bg-blue-500 text-white" : "border-2 border-slate-300 bg-white"
                    } ${current ? "ring-4 ring-blue-100 animate-pulse" : ""}`}
                    style={isRed && !completed ? { backgroundColor: "#F43F5E", borderColor: "#F43F5E" } : undefined}
                  >
                    {completed ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span
                    className={`mt-1 text-xs font-medium ${
                      completed || current ? "text-blue-600" : "text-slate-400"
                    }`}
                    style={isRed && current ? { color: "#F43F5E" } : undefined}
                  >
                    {label}
                  </span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 min-w-[24px] flex-1 rounded ${
                      isPast && !isRejected ? "bg-blue-500" : "bg-slate-200"
                    }`}
                    style={isRed && isPast ? { backgroundColor: "#F43F5E" } : undefined}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {isRejected && (
          <p className="mt-2 text-xs text-red-500">Application not progressed</p>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div
          className="mt-4 overflow-hidden border-t border-slate-100 pt-4"
          style={{ animation: "expandIn 0.25s ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          {loadingFull ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
          ) : fullApp ? (
            <ExpandedContent
              application={fullApp}
              onWithdraw={app.status === "pending" ? () => setWithdrawConfirm(true) : undefined}
              withdrawing={withdrawing}
              onConfirmWithdraw={handleWithdraw}
              onCancelWithdraw={() => setWithdrawConfirm(false)}
              withdrawConfirmOpen={withdrawConfirm}
            />
          ) : (
            <div className="py-4 text-sm text-slate-500">Could not load details.</div>
          )}
        </div>
      )}
    </div>
  );
}

function ExpandedContent({
  application,
  onWithdraw,
  withdrawing,
  onConfirmWithdraw,
  onCancelWithdraw,
  withdrawConfirmOpen,
}) {
  const [activeTab, setActiveTab] = useState("answers");
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
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {["answers", "timeline", "emails"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 py-2 text-sm font-medium capitalize ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 min-h-[120px]">
        {activeTab === "answers" && (
          <div className="space-y-4">
            {customQuestions.length === 0 && (application.answers || []).length === 0 && (
              <p className="text-sm text-slate-500">No answers recorded.</p>
            )}
            {customQuestions.map((q) => {
              const qId = (q.questionId || q._id || "").toString();
              const val = answersMap[qId];
              const display =
                val === undefined || val === null
                  ? "—"
                  : Array.isArray(val)
                    ? val.join(", ")
                    : String(val);
              const title = answerMetaById[qId]?.fieldLabel || q.label || "Question";
              return (
                <div key={qId}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-700">{display}</p>
                </div>
              );
            })}
            {customQuestions.length === 0 &&
              (application.answers || []).map((a, i) => {
                const raw = a.value !== undefined && a.value !== null ? a.value : a.answer;
                const text = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "—");
                return (
                  <div key={i}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {a.fieldLabel || `Answer ${i + 1}`}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-700">{text}</p>
                  </div>
                );
              })}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="relative ml-3">
            <div className="absolute left-[5px] top-2 bottom-0 w-px border-l-2 border-dashed border-slate-200" />
            <div className="space-y-4">
              {statusHistory.length === 0 && <p className="text-sm text-slate-500">No updates yet.</p>}
              {statusHistory.map((entry, i) => (
                <div key={i} className="relative flex gap-3">
                  <div
                    className="relative z-10 mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_META[entry.toStatus]?.dot || "#94A3B8" }}
                  />
                  <div>
                    <StatusPill status={entry.toStatus} />
                    <p className="mt-0.5 text-xs text-slate-500">
                      by {entry.changedBy?.name || "Someone"} · {formatRelative(entry.changedAt)}
                    </p>
                    {entry.note && (
                      <p className="ml-0 mt-1 text-sm italic text-slate-500">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "emails" && (
          <div className="space-y-3">
            {emailLogs.length === 0 && <p className="text-sm text-slate-500">No emails yet.</p>}
            {emailLogs.map((log) => (
              <div key={log._id} className="rounded-2xl rounded-tl-none bg-slate-100 p-4 text-left">
                <p className="text-sm font-semibold text-slate-800">{log.subject}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {(log.body || "").replace(/<[^>]+>/g, " ").slice(0, 180)}...
                </p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(log.sentAt)}</p>
                <button type="button" className="mt-1 text-xs font-medium text-blue-600 hover:underline">
                  View Full Email
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {onWithdraw && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onWithdraw}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
          >
            Withdraw Application
          </button>
        </div>
      )}

      {withdrawConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={onCancelWithdraw} aria-hidden />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-slate-900">Withdraw application?</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              This action cannot be undone. You will need to reapply if you change your mind.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCancelWithdraw}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmWithdraw}
                disabled={withdrawing}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {withdrawing ? "Withdrawing..." : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MyApplicationsPage() {
  const { applications, stats, loading, error, refetch } = useMyApplications();
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [fullApp, setFullApp] = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);

  const filtered = statusFilter
    ? applications.filter((a) => a.status === statusFilter)
    : applications;

  const fetchFullApplication = useCallback(async (id) => {
    if (!id) {
      setFullApp(null);
      return;
    }
    setLoadingFull(true);
    setFullApp(null);
    try {
      const res = await api.get(`/api/applications/${id}`);
      if (res.data?.success) setFullApp(res.data.data);
    } catch {
      setFullApp(null);
    } finally {
      setLoadingFull(false);
    }
  }, []);

  const handleToggleExpand = useCallback(
    (id) => {
      if (expandedId === id) {
        setExpandedId(null);
        setFullApp(null);
      } else {
        setExpandedId(id);
        fetchFullApplication(id);
      }
    },
    [expandedId, fetchFullApplication]
  );

  const countByStatus = (id) => {
    if (!id) return applications.length;
    return applications.filter((a) => a.status === id).length;
  };

  const statCards = [
    { label: "Total Applied", value: stats.applied, icon: Send, color: "#2563EB" },
    { label: "Shortlisted", value: stats.shortlisted, icon: Check, color: "#3B82F6" },
    { label: "Interviews", value: stats.interviews, icon: Check, color: "#F59E0B" },
    { label: "Offers", value: stats.offers, icon: Check, color: "#22C55E" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#F8FAFC] px-4 py-6 md:px-6 md:py-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Applications</h1>
        <p className="mt-1 text-sm text-slate-500">Track your club recruitment progress</p>

        {/* Stats */}
        <div className="mt-6 mb-8 grid grid-cols-2 gap-4 md:flex md:gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs font-medium text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex w-max gap-2 pb-2 md:flex-wrap">
            {STATUS_TABS.map((tab) => {
              const count = countByStatus(tab.id);
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id || "all"}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs ${
                      active ? "bg-white/20" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center">
            <ClipboardList className="h-16 w-16 text-slate-200 md:h-20 md:w-20" />
            <p className="mt-4 text-xl font-semibold text-slate-700">No applications yet</p>
            <p className="mt-1 text-sm text-slate-400">Start applying to clubs that match your interests</p>
            <Link
              to="/student/recruitment"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Browse Open Drives →
            </Link>
          </div>
        ) : (
          <div className="space-y-0">
            {filtered.map((app) => (
              <ApplicationCard
                key={app._id}
                app={app}
                expanded={expandedId === app._id}
                onToggle={handleToggleExpand}
                fullApp={expandedId === app._id ? fullApp : null}
                loadingFull={expandedId === app._id && loadingFull}
                onRefetch={refetch}
              />
            ))}
          </div>
        )}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes expandIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 800px; }
        }
      `}</style>
    </div>
  );
}
