import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Eye,
  Loader2,
  Lock,
  Mail,
  Rocket,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import api from "../../api/client";
import { getChatSocket } from "../../realtime/chatSocket";

const TRIGGERS = [
  {
    id: "completion",
    label: "On Event Completion",
    description:
      "Automatically issue certificates to all eligible attendees as soon as the event is marked completed.",
    recommended: true,
    icon: ShieldCheck,
  },
  {
    id: "manual",
    label: "On Manual Approval",
    description:
      "Review eligibility and issue certificates only after a manual approval by the organizer.",
    recommended: false,
    icon: Lock,
  },
];

const FILTERS = [
  { id: "all", label: "All Eligible" },
  { id: "merit", label: "Merit" },
  { id: "participation", label: "Participation" },
];

function getSuggestionLabel(type) {
  if (!type) return "participation";
  const normalized = String(type).toLowerCase();
  if (normalized.startsWith("winner")) return "winner";
  if (normalized.includes("merit") || normalized.includes("runner")) return "merit";
  return "participation";
}

function getSuggestionPill(type) {
  const label = getSuggestionLabel(type);
  if (label === "winner") {
    return {
      text: "🤖 Winner",
      className: "bg-amber-100 text-amber-800 border border-amber-200",
    };
  }
  if (label === "merit") {
    return {
      text: "🤖 Merit",
      className: "bg-blue-100 text-blue-800 border border-blue-200",
    };
  }
  return {
    text: "🤖 Participation",
    className: "bg-slate-100 text-slate-700 border border-slate-200",
  };
}

function getEligibilityChip(eligibility) {
  if (!eligibility) {
    return {
      className: "bg-slate-100 text-slate-600 border border-slate-200",
      label: "No data",
      detail: "—",
    };
  }

  const attendance = eligibility.attendance ?? eligibility.attendancePercentage;
  const quiz = eligibility.quiz ?? eligibility.quizScore;
  const submission = eligibility.submission ?? eligibility.submissionStatus;

  let score = 0;
  if (typeof attendance === "number") score += attendance;
  if (typeof quiz === "number") score += quiz;
  if (submission && String(submission).toLowerCase().includes("submitted")) score += 20;

  let color = {
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    label: "Highly Eligible",
  };

  if (score < 120) {
    color = {
      className: "bg-amber-50 text-amber-700 border border-amber-200",
      label: "Borderline Eligible",
    };
  }
  if (score < 80) {
    color = {
      className: "bg-rose-50 text-rose-700 border border-rose-200",
      label: "At Risk",
    };
  }

  const pieces = [];
  if (typeof attendance === "number") pieces.push(`${attendance}% attendance`);
  if (typeof quiz === "number") pieces.push(`Quiz ${quiz}`);
  if (submission) pieces.push(String(submission));

  return {
    ...color,
    detail: pieces.join(" • ") || "No metrics available",
  };
}

function buildStudentRow(raw) {
  const id =
    raw._id ||
    raw.studentId?._id ||
    raw.student?._id ||
    raw.studentId ||
    raw.id ||
    raw.userId ||
    String(Math.random());

  const name =
    raw.name ||
    raw.fullName ||
    raw.studentName ||
    raw.student?.name ||
    raw.profile?.name ||
    "Student";

  const email =
    raw.email ||
    raw.student?.email ||
    raw.profile?.email ||
    raw.user?.email ||
    "";

  const rollNo =
    raw.rollNo ||
    raw.roll_number ||
    raw.enrollmentNo ||
    raw.student?.rollNo ||
    raw.student?.roll_number ||
    "—";

  const eligibility =
    raw.eligibility || {
      attendance: raw.attendancePercentage,
      quiz: raw.quizScore,
      submission: raw.submissionStatus,
    };

  const suggestionRaw =
    raw.smartSuggestion ||
    raw.suggestion ||
    raw.aiSuggestion ||
    raw.recommendedType ||
    "participation";

  const suggestion = getSuggestionLabel(suggestionRaw);

  const status =
    raw.status ||
    raw.certificateStatus ||
    (raw.hasCertificate ? "generated" : "pending");

  const avatar =
    name &&
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return {
    id,
    name,
    email,
    rollNo,
    eligibility,
    suggestion,
    overrideType: suggestion,
    status,
    avatar,
  };
}

export default function CertificateDistributionPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [eventTitle, setEventTitle] = useState(
    location.state?.eventTitle || location.state?.title || "Selected Event"
  );

  const [trigger, setTrigger] = useState("completion");
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState(null);
  const [filter, setFilter] = useState("all");

  const [sendEmail, setSendEmail] = useState(true);
  const [allowPortalDownload, setAllowPortalDownload] = useState(true);
  const [enableLinkedInSharing, setEnableLinkedInSharing] = useState(true);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [tableExpanded, setTableExpanded] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progress, setProgress] = useState({
    total: 0,
    processed: 0,
    percentage: 0,
    currentStudentName: "",
    status: "idle",
  });

  const stats = useMemo(() => {
    const total = students.length;
    const generated = students.filter((s) => s.status === "generated").length;
    const status =
      total === 0
        ? "No recipients"
        : generated === 0
        ? "Ready"
        : generated === total
        ? "Completed"
        : "In Progress";
    return { total, generated, status };
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (filter === "all") return students;
    if (filter === "merit") {
      return students.filter((s) => s.suggestion === "merit" || s.suggestion === "winner");
    }
    if (filter === "participation") {
      return students.filter((s) => s.suggestion === "participation");
    }
    return students;
  }, [students, filter]);

  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.has(s.id));

  const someVisibleSelected =
    filteredStudents.some((s) => selectedIds.has(s.id)) && !allVisibleSelected;

  const generationCount = useMemo(() => {
    if (selectedIds.size > 0) return selectedIds.size;
    return students.length;
  }, [selectedIds.size, students.length]);

  const canActivate = !!selectedTemplateId && students.length > 0 && !isGenerating;

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await api.get("/api/certificates/templates");
      const list = res.data?.data ?? res.data ?? [];
      setTemplates(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) {
        setSelectedTemplateId(list[0]._id || list[0].id || null);
      }
    } catch (e) {
      // non-fatal
      // eslint-disable-next-line no-console
      console.error("Failed to load templates", e);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const fetchEligibleStudents = useCallback(async () => {
    if (!eventId) return;
    setLoadingStudents(true);
    setStudentsError(null);
    try {
      const res = await api.get(`/api/certificates/events/${eventId}/eligible`);
      const payload = res.data?.data ?? res.data ?? {};
      const list = Array.isArray(payload.eligible)
        ? payload.eligible
        : Array.isArray(payload)
        ? payload
        : Array.isArray(payload.items)
        ? payload.items
        : [];

      const rows = list.map(buildStudentRow);
      setStudents(rows);

      if (payload.eventTitle || payload.title) {
        setEventTitle(payload.eventTitle || payload.title);
      }
    } catch (e) {
      setStudentsError(e.message || "Failed to load eligible recipients");
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    fetchEligibleStudents();
  }, [fetchEligibleStudents]);

  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return undefined;

    const handler = (payload) => {
      if (!payload) return;
      if (payload.eventId && String(payload.eventId) !== String(eventId)) return;

      setProgressVisible(true);
      setProgress((prev) => {
        const total = payload.total ?? prev.total ?? students.length ?? 0;
        const processed = payload.processed ?? payload.currentIndex ?? prev.processed ?? 0;
        const percentageFromPayload = payload.percentage;
        const percentage =
          typeof percentageFromPayload === "number"
            ? percentageFromPayload
            : total > 0
            ? Math.round((processed / total) * 100)
            : prev.percentage;

        return {
          total,
          processed,
          percentage,
          currentStudentName:
            payload.currentStudentName || payload.studentName || prev.currentStudentName,
          status: payload.status || prev.status,
        };
      });

      if (payload.status === "completed" || payload.status === "failed") {
        setIsGenerating(false);
        fetchEligibleStudents();
      }
    };

    socket.on("certificate:theatre", handler);
    return () => {
      socket.off("certificate:theatre", handler);
    };
  }, [eventId, fetchEligibleStudents, students.length]);

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredStudents.forEach((s) => next.delete(s.id));
      } else {
        filteredStudents.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateOverrideFor = (id, value) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, overrideType: value } : s))
    );
  };

  const handleBulkSet = (value) => {
    setStudents((prev) =>
      prev.map((s) =>
        selectedIds.has(s.id)
          ? {
              ...s,
              overrideType: value,
            }
          : s
      )
    );
  };

  const handleActivate = async () => {
    if (!canActivate || !eventId) return;
    const confirmed = window.confirm(
      `Generate ${generationCount} certificates for ${eventTitle}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setIsGenerating(true);
      setProgressVisible(true);
      setProgress((prev) => ({
        ...prev,
        status: "generating",
      }));

      const payload = {
        trigger,
        templateId: selectedTemplateId,
        options: {
          sendEmail,
          allowPortalDownload,
          enableLinkedInSharing,
        },
        recipients: students.map((s) => ({
          studentId: s.id,
          type: s.overrideType,
          selected: selectedIds.size === 0 || selectedIds.has(s.id),
        })),
      };

      await api.post(`/api/certificates/events/${eventId}/generate`, payload);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.message || "Failed to start certificate generation");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:py-8">
        {/* Left column */}
        <div className="w-full space-y-4 lg:w-[360px]">
          {/* Header */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Event Details</span>
          </button>

          <div className="mt-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Certificate Distribution Logic
                </h1>
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                  {eventTitle}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary rounded-xl border-0 px-3 py-2 text-xs font-semibold text-white shadow-sm dark:bg-primary dark:hover:bg-primary/90"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={!canActivate}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm ${
                    canActivate
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Rocket className="h-4 w-4" />
                  <span>Activate Automation</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 1 - Trigger */}
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              ⚡ Distribution Trigger
            </p>
            <div className="mt-3 space-y-3">
              {TRIGGERS.map((t) => {
                const Icon = t.icon;
                const isActive = trigger === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTrigger(t.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      isActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`mt-1 flex h-4 w-4 items-center justify-center rounded-full border ${
                        isActive
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {Icon && (
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                              isActive
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                        )}
                        <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                        {t.recommended && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2 - Template selection */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Select Template</p>
              {templatesLoading && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {templates.map((tpl) => {
                const active =
                  selectedTemplateId === (tpl._id || tpl.id || tpl.templateId);
                const category =
                  tpl.category ||
                  tpl.type ||
                  (tpl.isMerit ? "Merit" : tpl.isWinner ? "Winner" : "Participation");
                return (
                  <button
                    key={tpl._id || tpl.id || tpl.templateId}
                    type="button"
                    onClick={() =>
                      setSelectedTemplateId(tpl._id || tpl.id || tpl.templateId)
                    }
                    className={`relative flex h-24 flex-col justify-between rounded-xl border p-2 text-left transition ${
                      active
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="h-14 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200" />
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <p className="truncate text-[11px] font-semibold text-slate-800">
                        {tpl.name || tpl.title || "Template"}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600">
                        {category}
                      </span>
                    </div>
                    {active && (
                      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-500/5 to-transparent">
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] text-white shadow-sm">
                          ✓
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => navigate("/admin/certificates/designer")}
                className="flex h-24 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs font-medium text-slate-500 hover:border-slate-400 hover:bg-slate-100"
              >
                <span className="text-base">＋</span>
                <span className="mt-1">Create Custom Template</span>
              </button>
            </div>
          </div>

          {/* Card 3 - Additional settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-slate-900">Additional Settings</p>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Send Email Notification
                  </p>
                  <p className="text-xs text-slate-500">
                    Deliver certificates directly to inbox
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSendEmail((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  sendEmail ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    sendEmail ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Allow Download in Portal
                </p>
                <p className="text-xs text-slate-500">
                  Students can re-download from their dashboard
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllowPortalDownload((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  allowPortalDownload ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    allowPortalDownload ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Enable LinkedIn Sharing
                </p>
                <p className="text-xs text-slate-500">
                  One-click sharing to LinkedIn profiles
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnableLinkedInSharing((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableLinkedInSharing ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    enableLinkedInSharing ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 space-y-4 pb-20">
          {/* Stats row */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Total Recipients
                </p>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {stats.total ?? 0}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Status
                </p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    stats.status === "Completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : stats.status === "In Progress"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : stats.total === 0
                      ? "bg-slate-100 text-slate-600 border border-slate-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {stats.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Already Generated
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {stats.generated ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Search & filters */}
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Search by name, email, or roll number..."
                  onChange={(e) => {
                    const q = e.target.value.toLowerCase();
                    setStudents((prev) =>
                      prev.map((s) => ({
                        ...s,
                        _hidden:
                          q &&
                          !`${s.name} ${s.email} ${s.rollNo}`
                            .toLowerCase()
                            .includes(q),
                      }))
                    );
                  }}
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-symbols-outlined text-[18px]">
                    search
                  </span>
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      active
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart merit table */}
          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setTableExpanded((v) => !v)}
              className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              <span>Smart Merit Engine</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  tableExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {tableExpanded && (
              <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <button
                          type="button"
                          onClick={toggleSelectAllVisible}
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            allVisibleSelected
                              ? "border-blue-600 bg-blue-600"
                              : someVisibleSelected
                              ? "border-blue-400 bg-blue-100"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {(allVisibleSelected || someVisibleSelected) && (
                            <span className="h-2 w-2 rounded-sm bg-white" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Roll No</th>
                      <th className="px-4 py-3">Eligibility</th>
                      <th className="px-4 py-3">Smart Suggestion</th>
                      <th className="px-4 py-3">Override Type</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loadingStudents && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            <span>Loading eligible recipients…</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {studentsError && !loadingStudents && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-rose-500">
                          {studentsError}
                        </td>
                      </tr>
                    )}
                    {!loadingStudents &&
                      !studentsError &&
                      filteredStudents
                        .filter((s) => !s._hidden)
                        .map((s) => {
                          const eligibilityChip = getEligibilityChip(s.eligibility);
                          const suggestionPill = getSuggestionPill(s.suggestion);
                          const overriding = s.overrideType !== s.suggestion;

                          return (
                            <tr key={s.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 align-top">
                                <button
                                  type="button"
                                  onClick={() => toggleSelectOne(s.id)}
                                  className={`mt-1 flex h-4 w-4 items-center justify-center rounded border ${
                                    selectedIds.has(s.id)
                                      ? "border-blue-600 bg-blue-600"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {selectedIds.has(s.id) && (
                                    <span className="h-2 w-2 rounded-sm bg-white" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                                    {s.avatar || "ST"}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-900">
                                      {s.name}
                                    </p>
                                    {s.email && (
                                      <p className="mt-0.5 text-[11px] text-slate-500">
                                        {s.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <p className="font-mono text-[11px] text-slate-700">
                                  {s.rollNo}
                                </p>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div
                                  className={`inline-flex flex-col rounded-xl px-2.5 py-1.5 text-[10px] ${eligibilityChip.className}`}
                                >
                                  <span className="font-semibold">
                                    {eligibilityChip.label}
                                  </span>
                                  <span className="mt-0.5 text-[10px]">
                                    {eligibilityChip.detail}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${suggestionPill.className}`}
                                  title="Smart suggestion based on attendance, quizzes, and submissions"
                                >
                                  <span>{suggestionPill.text}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="space-y-1">
                                  <select
                                    value={s.overrideType}
                                    onChange={(e) =>
                                      updateOverrideFor(s.id, e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                                  >
                                    <option value="participation">Participation</option>
                                    <option value="merit">Merit</option>
                                    <option value="winner_1st">Winner (1st)</option>
                                    <option value="winner_2nd">Winner (2nd)</option>
                                    <option value="winner_3rd">Winner (3rd)</option>
                                  </select>
                                  {overriding && (
                                    <p className="text-[10px] font-medium text-amber-600">
                                      Overriding AI suggestion
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  {s.status === "generated" && (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                      <span className="text-emerald-600">Generated</span>
                                    </>
                                  )}
                                  {s.status === "pending" && (
                                    <>
                                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                                      <span className="text-slate-500">Pending</span>
                                    </>
                                  )}
                                  {s.status === "generating" && (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                                      <span className="text-blue-600">Generating</span>
                                    </>
                                  )}
                                  {s.status === "failed" && (
                                    <>
                                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                      <span className="text-rose-600">Failed</span>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    {!loadingStudents &&
                      !studentsError &&
                      filteredStudents.filter((s) => !s._hidden).length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-6 text-center text-xs text-slate-400"
                          >
                            No recipients match the current filters.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="fixed inset-x-4 bottom-4 z-30 md:inset-x-10">
              <div className="animate-slide-down rounded-2xl bg-blue-600 px-4 py-3 text-xs font-medium text-white shadow-2xl md:flex md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[11px]">
                    {selectedIds.size}
                  </span>
                  <span>
                    {selectedIds.size} student
                    {selectedIds.size > 1 ? "s" : ""} selected
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 md:mt-0">
                  <button
                    type="button"
                    onClick={() => handleBulkSet("merit")}
                    className="rounded-full bg-white/10 px-3 py-1 text-[11px] hover:bg-white/20"
                  >
                    Set Merit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSet("participation")}
                    className="rounded-full bg-white/10 px-3 py-1 text-[11px] hover:bg-white/20"
                  >
                    Set Participation
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="rounded-full bg-white/0 px-3 py-1 text-[11px] hover:bg-white/10"
                  >
                    Deselect
                  </button>
                </div>
              </div>
              <style>
                {`
                @keyframes slideDownBulkBar {
                  0% { transform: translateY(100%); opacity: 0; }
                  100% { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-down {
                  animation: slideDownBulkBar 0.25s ease-out;
                }
              `}
              </style>
            </div>
          )}

          {/* Progress section */}
          {progressVisible && (
            <div className="mt-4 rounded-2xl bg-blue-50 p-6 shadow-sm">
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, progress.percentage || 0)}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                Generating {progress.total || generationCount} / {stats.total} certificates…
              </p>
              {progress.currentStudentName && (
                <p className="mt-1 text-xs text-slate-600">
                  Processing: {progress.currentStudentName}
                </p>
              )}
              <p className="mt-2 text-2xl font-bold text-blue-600">
                {Math.min(100, progress.percentage || 0)}%
              </p>
            </div>
          )}

          {/* Bottom Activate button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleActivate}
              disabled={!canActivate}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-lg font-semibold shadow-md ${
                canActivate
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating…</span>
                </>
              ) : (
                <>
                  <span>🚀 Activate Automation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

