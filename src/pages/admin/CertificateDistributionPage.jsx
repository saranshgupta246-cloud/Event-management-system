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
  XCircle,
} from "lucide-react";
import api from "../../api/client";

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

const StatCard = ({ label, value, badge }) => (
  <div className="flex min-h-[90px] flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1e2d42] dark:bg-[#161f2e]">
    <p className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
    {badge || (
      <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
    )}
  </div>
);

function TemplateUploadSlot({ type, label, sub, icon, eventId, currentUrl, uploadTemplate }) {
  const inputId = `template-upload-${type}`;
  const hasFile = !!currentUrl;
  return (
    <label
      htmlFor={inputId}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-all ${
        hasFile
          ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10"
          : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 dark:border-[#2d3f55] dark:hover:border-indigo-500 dark:hover:bg-slate-700/50"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${
          type === "merit" ? "bg-amber-100 dark:bg-amber-500/10" : "bg-blue-100 dark:bg-blue-500/10"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
      </div>
      {hasFile ? (
        <p className="max-w-full truncate px-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          {currentUrl.split("/").pop()}
        </p>
      ) : (
        <p className="text-xs text-slate-400">No file chosen</p>
      )}
      <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 dark:border-[#2d3f55] dark:bg-[#1e2d42] dark:text-slate-300">
        {hasFile ? "Replace" : "Choose PDF"}
      </span>
      <input
        id={inputId}
        name={inputId}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f || !eventId) return;
          const field = type === "merit" ? "meritTemplate" : "participationTemplate";
          uploadTemplate(field, f);
        }}
      />
    </label>
  );
}

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
      className:
        "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/35",
    };
  }
  if (label === "merit") {
    return {
      text: "🤖 Merit",
      className:
        "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/35",
    };
  }
  return {
    text: "🤖 Participation",
    className:
      "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#1e2d42]/80 dark:text-slate-200 dark:border-[#2d3f55]",
  };
}

function getEligibilityChip(eligibility) {
  if (!eligibility) {
    return {
      className:
        "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#1e2d42]/60 dark:text-slate-300 dark:border-[#2d3f55]",
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
    className:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
    label: "Highly Eligible",
  };

  if (score < 120) {
    color = {
      className:
        "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25",
      label: "Borderline Eligible",
    };
  }
  if (score < 80) {
    color = {
      className:
        "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25",
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

  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, ""),
    []
  );

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

  const [meritTemplateUrl, setMeritTemplateUrl] = useState("");
  const [participationTemplateUrl, setParticipationTemplateUrl] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);

  const [coords, setCoords] = useState({
    nameX: 200,
    nameY: 400,
    eventX: 200,
    eventY: 350,
    dateX: 200,
    dateY: 300,
    positionX: 200,
    positionY: 250,
    fontSize: 24,
  });
  const [coordsSaved, setCoordsSaved] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState("merit");
  const [coordsOpen, setCoordsOpen] = useState(false);

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

  const hasPdfTemplates = !!(meritTemplateUrl || participationTemplateUrl);
  const canActivate =
    students.length > 0 && !isGenerating && (!!selectedTemplateId || hasPdfTemplates);

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

      setMeritTemplateUrl(payload.meritTemplateUrl || "");
      setParticipationTemplateUrl(payload.participationTemplateUrl || "");

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
    if (!eventId) return;
    (async () => {
      try {
        const res = await api.get(`/api/admin/events/${eventId}`);
        const eventData = res.data?.data;
        if (eventData?.certificateCoords) {
          setCoords(eventData.certificateCoords);
        }
      } catch {
        // non-fatal
      }
    })();
  }, [eventId]);

  async function saveCoords() {
    await api.put(`/api/admin/events/${eventId}/certificate-coords`, coords);
    setCoordsSaved(true);
    setTimeout(() => setCoordsSaved(false), 2000);
  }

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

  const handleTemplateUpload = async (field, file) => {
    if (!eventId || !file) return;
    try {
      setUploadingTemplate(true);
      const fd = new FormData();
      fd.append(field, file);
      await api.post(`/api/certificates/events/${eventId}/templates`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchEligibleStudents();
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.response?.data?.message || e.message || "Template upload failed");
    } finally {
      setUploadingTemplate(false);
    }
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
        automationMode: trigger === "manual" ? "manual" : "auto",
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Page header — actions only here */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Event Details</span>
        </button>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Certificate Distribution Logic
            </h1>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
              {eventTitle}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="btn-primary rounded-xl border-0 bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 dark:bg-primary dark:hover:bg-primary/90"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleActivate}
              disabled={!canActivate}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm ${
                canActivate
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-[#1e2d42] dark:text-slate-400"
              }`}
            >
              <Rocket className="h-4 w-4" />
              <span>Activate Automation</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* Left column — two cards only */}
          <div className="w-full space-y-4 lg:w-[360px] lg:shrink-0">
          {/* Card 1 - Trigger */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1e2d42] dark:bg-[#161f2e]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
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
                        ? "border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-500/15"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-[#2d3f55] dark:bg-[#161f2e]/80 dark:hover:border-slate-500"
                    }`}
                  >
                    <div
                      className={`mt-1 flex h-4 w-4 items-center justify-center rounded-full border ${
                        isActive
                          ? "border-primary-600 bg-primary-600"
                          : "border-slate-300 bg-white dark:border-[#2d3f55] dark:bg-[#1e2d42]"
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
                                ? "bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300"
                                : "bg-slate-100 text-slate-600 dark:bg-[#1e2d42] dark:text-slate-300"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                        )}
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.label}</p>
                        {t.recommended && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2 — Certificate templates */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1e2d42] dark:bg-[#161f2e]">
            <p className="mb-1 text-sm font-medium text-slate-900 dark:text-white">
              Certificate templates
            </p>
            <p className="mb-4 text-xs leading-relaxed text-slate-400">
              Upload a PDF for each type. Text coordinates are applied per student at generation time.
            </p>
            {templatesLoading && (
              <p className="mb-3 flex items-center gap-1 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading template list…
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <TemplateUploadSlot
                type="merit"
                label="Merit template"
                sub="Winners & merit placement"
                icon="🏆"
                eventId={eventId}
                currentUrl={meritTemplateUrl}
                uploadTemplate={handleTemplateUpload}
              />
              <TemplateUploadSlot
                type="participation"
                label="Participation template"
                sub="All attendees"
                icon="📋"
                eventId={eventId}
                currentUrl={participationTemplateUrl}
                uploadTemplate={handleTemplateUpload}
              />
            </div>
            {uploadingTemplate && (
              <p className="mt-3 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading template…
              </p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Stats row */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <StatCard label="Total Recipients" value={stats.total ?? 0} />
            <StatCard
              label="Status"
              badge={
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    stats.status === "Completed"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : stats.status === "In Progress"
                      ? "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                      : stats.total === 0
                      ? "border border-slate-200 bg-slate-100 text-slate-600 dark:border-[#2d3f55] dark:bg-[#1e2d42]/50 dark:text-slate-300"
                      : "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                  }`}
                >
                  {stats.status}
                </span>
              }
            />
            <StatCard label="Already Generated" value={stats.generated ?? 0} />
          </div>

          {/* Text placement */}
          <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#1e2d42] dark:bg-[#161f2e]">
            <button
              type="button"
              onClick={() => setCoordsOpen((p) => !p)}
              className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
            >
              <span>🧭 Text placement</span>
              <span className={`text-xs transition-transform ${coordsOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {coordsOpen && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-[#1e2d42]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Text placement
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Set where each text field appears on the certificate. Coordinates are in PDF points from top-left.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={saveCoords}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {coordsSaved ? "Saved!" : "Save coords"}
                  </button>
                </div>

                <div className="flex gap-6 flex-col lg:flex-row">
                  {/* Left: inputs */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                        Font size (pt)
                      </label>
                      <input
                        type="number"
                        value={coords.fontSize}
                        onChange={(e) =>
                          setCoords((c) => ({ ...c, fontSize: Number(e.target.value) }))
                        }
                        className="w-24 rounded-lg border border-slate-200 dark:border-[#1e2d42] bg-white dark:bg-[#0d1117] px-2 py-1 text-sm text-slate-900 dark:text-white"
                      />
                    </div>

                    {[
                      { key: "name", label: "Student name" },
                      { key: "event", label: "Event title" },
                      { key: "date", label: "Event date" },
                      { key: "position", label: "Position/rank" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                          {label}
                        </label>
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-slate-400 w-4">X</span>
                          <input
                            type="number"
                            value={coords[`${key}X`]}
                            onChange={(e) =>
                              setCoords((c) => ({
                                ...c,
                                [`${key}X`]: Number(e.target.value),
                              }))
                            }
                            className="w-20 rounded-lg border border-slate-200 dark:border-[#1e2d42] bg-white dark:bg-[#0d1117] px-2 py-1 text-sm text-slate-900 dark:text-white"
                          />
                          <span className="text-xs text-slate-400 w-4">Y</span>
                          <input
                            type="number"
                            value={coords[`${key}Y`]}
                            onChange={(e) =>
                              setCoords((c) => ({
                                ...c,
                                [`${key}Y`]: Number(e.target.value),
                              }))
                            }
                            className="w-20 rounded-lg border border-slate-200 dark:border-[#1e2d42] bg-white dark:bg-[#0d1117] px-2 py-1 text-sm text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right: live preview */}
                  <div className="w-64 flex-shrink-0">
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTemplate("merit")}
                        className={`text-xs px-2 py-1 rounded ${
                          previewTemplate === "merit"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-[#1e2d42] text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        Merit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTemplate("participation")}
                        className={`text-xs px-2 py-1 rounded ${
                          previewTemplate === "participation"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-[#1e2d42] text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        Participation
                      </button>
                    </div>

                    <div
                      className="relative w-64 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#1e2d42] rounded-lg overflow-hidden"
                      style={{ height: "362px" }}
                    >
                      {(previewTemplate === "merit"
                        ? meritTemplateUrl
                        : participationTemplateUrl) ? (
                        <iframe
                          title="Certificate template preview"
                          src={`${apiBase}${
                            previewTemplate === "merit"
                              ? meritTemplateUrl
                              : participationTemplateUrl
                          }`}
                          className="absolute inset-0 w-full h-full"
                          style={{ border: "none" }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                          No template uploaded
                        </div>
                      )}

                      {[
                        { key: "name", label: "Name", color: "#6366f1" },
                        { key: "event", label: "Event", color: "#f59e0b" },
                        { key: "date", label: "Date", color: "#10b981" },
                        { key: "position", label: "Pos", color: "#ef4444" },
                      ].map(({ key, label, color }) => {
                        const pdfW = 595,
                          pdfH = 842;
                        const previewW = 256,
                          previewH = 362;
                        const x = (coords[`${key}X`] / pdfW) * previewW;
                        const y = (coords[`${key}Y`] / pdfH) * previewH;
                        return (
                          <div
                            key={key}
                            style={{
                              position: "absolute",
                              left: `${x}px`,
                              top: `${y}px`,
                              transform: "translate(-50%, -50%)",
                              pointerEvents: "none",
                            }}
                          >
                            <div
                              style={{
                                background: color,
                                color: "#fff",
                                fontSize: "9px",
                                fontWeight: 600,
                                padding: "1px 4px",
                                borderRadius: "3px",
                                whiteSpace: "nowrap",
                                opacity: 0.85,
                              }}
                            >
                              {label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                      Colored labels show approximate text positions on the certificate.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Settings */}
          <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#1e2d42] dark:bg-[#161f2e]">
            <button
              type="button"
              onClick={() => setSettingsOpen((p) => !p)}
              className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
            >
              <span>⚙ Settings</span>
              <span
                className={`text-xs transition-transform ${settingsOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {settingsOpen && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 pb-4 pt-3 dark:border-[#1e2d42]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Send Email Notification
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Deliver certificates directly to inbox
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendEmail((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sendEmail ? "bg-primary-600" : "bg-slate-300 dark:bg-[#2d3f55]"
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
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Allow Download in Portal
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Students can re-download from their dashboard
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowPortalDownload((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      allowPortalDownload ? "bg-primary-600" : "bg-slate-300 dark:bg-[#2d3f55]"
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
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Enable LinkedIn Sharing
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      One-click sharing to LinkedIn profiles
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableLinkedInSharing((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enableLinkedInSharing ? "bg-primary-600" : "bg-slate-300 dark:bg-[#2d3f55]"
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
            )}
          </div>

          {/* Search & filters */}
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="relative">
                <input
                  id="certificate-distribution-search"
                  name="certificate-distribution-search"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/30"
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
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
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
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart merit table */}
          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:shadow-none">
            <button
              type="button"
              onClick={() => setTableExpanded((v) => !v)}
              className="flex w-full items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-[#1e2d42] dark:bg-[#161f2e]/50 dark:text-slate-400"
            >
              <span>Smart Merit Engine</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform dark:text-slate-500 ${
                  tableExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {tableExpanded && (
              <div className="max-h-[520px] overflow-auto dark:bg-[#161f2e]/40">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-[#161f2e] dark:text-slate-400">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <button
                          type="button"
                          onClick={toggleSelectAllVisible}
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            allVisibleSelected
                              ? "border-primary-600 bg-primary-600"
                              : someVisibleSelected
                              ? "border-primary-400 bg-primary-100 dark:border-primary-500 dark:bg-primary-500/30"
                              : "border-slate-300 bg-white dark:border-[#2d3f55] dark:bg-[#161f2e]"
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
                  <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-700 dark:bg-[#161f2e]/30">
                    {loadingStudents && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 dark:bg-[#161f2e]">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            <span>Loading eligible recipients…</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {studentsError && !loadingStudents && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-rose-500 dark:text-rose-400">
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
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                              <td className="px-4 py-3 align-top">
                                <button
                                  type="button"
                                  onClick={() => toggleSelectOne(s.id)}
                                  className={`mt-1 flex h-4 w-4 items-center justify-center rounded border ${
                                    selectedIds.has(s.id)
                                      ? "border-primary-600 bg-primary-600"
                                      : "border-slate-300 bg-white dark:border-[#2d3f55] dark:bg-[#161f2e]"
                                  }`}
                                >
                                  {selectedIds.has(s.id) && (
                                    <span className="h-2 w-2 rounded-sm bg-white" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-[#1e2d42] dark:text-slate-200">
                                    {s.avatar || "ST"}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                      {s.name}
                                    </p>
                                    {s.email && (
                                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                        {s.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
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
                                    id={`cert-type-${s.id}`}
                                    name={`cert-type-${s.id}`}
                                    value={s.overrideType}
                                    onChange={(e) =>
                                      updateOverrideFor(s.id, e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/40 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/40"
                                  >
                                    <option value="participation">Participation</option>
                                    <option value="merit">Merit</option>
                                    <option value="winner_1st">Winner (1st)</option>
                                    <option value="winner_2nd">Winner (2nd)</option>
                                    <option value="winner_3rd">Winner (3rd)</option>
                                  </select>
                                  {overriding && (
                                    <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
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
                                      <span className="text-emerald-600 dark:text-emerald-400">Generated</span>
                                    </>
                                  )}
                                  {s.status === "pending" && (
                                    <>
                                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                                      <span className="text-slate-500 dark:text-slate-400">Pending</span>
                                    </>
                                  )}
                                  {s.status === "generating" && (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-600" />
                                      <span className="text-primary-600 dark:text-primary-400">Generating</span>
                                    </>
                                  )}
                                  {s.status === "failed" && (
                                    <>
                                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                      <span className="text-rose-600 dark:text-rose-400">Failed</span>
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
                            className="px-4 py-6 text-center text-xs text-slate-400 dark:bg-[#161f2e]/20 dark:text-slate-500"
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
              <div className="animate-slide-down rounded-2xl bg-primary-600 px-4 py-3 text-xs font-medium text-white shadow-2xl md:flex md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-[11px]">
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
            <div className="mt-4 rounded-2xl bg-primary-50 p-6 shadow-sm dark:bg-primary-950/40 dark:shadow-none">
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1e2d42]">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, progress.percentage || 0)}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Generating {progress.total || generationCount} / {stats.total} certificates…
              </p>
              {progress.currentStudentName && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Processing: {progress.currentStudentName}
                </p>
              )}
              <p className="mt-2 text-2xl font-bold text-primary-600 dark:text-primary-400">
                {Math.min(100, progress.percentage || 0)}%
              </p>
            </div>
          )}

        </div>
        </div>
      </div>
    </div>
  );
}

