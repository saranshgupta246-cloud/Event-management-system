import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Award,
  Download as DownloadIcon,
  Eye,
  Trophy,
  Star,
  ScrollText,
  Copy,
  ExternalLink,
  Linkedin,
  X,
  FileText,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { resolveCertificateAssetUrl } from "../../utils/certificateUrls";

const CLIENT_URL =
  (typeof window !== "undefined" && window.location.origin) ||
  (import.meta.env.VITE_CLIENT_URL ?? "http://localhost:5173");

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

function getTypeMeta(type) {
  switch (type) {
    case "winner":
      return {
        label: "Winner",
        badgeText: "Winner",
        badgeClass:
          "bg-amber-400 text-amber-900 shadow-[0_0_0_1px_rgba(146,64,14,0.4)]",
        bgClass:
          "bg-gradient-to-br from-amber-500 via-yellow-300 to-amber-700",
        icon: Trophy,
      };
    case "merit":
    case "runner_up":
      return {
        label: type === "runner_up" ? "Runner Up" : "Merit",
        badgeText: "â­ Merit",
        badgeClass:
          "bg-blue-500 text-white shadow-[0_0_0_1px_rgba(30,64,175,0.5)]",
        bgClass:
          "bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700",
        icon: Star,
      };
    default:
      return {
        label: "Participation",
        badgeText: "âœ“ Participation",
        badgeClass:
          "bg-slate-800 text-slate-100 shadow-[0_0_0_1px_rgba(148,163,184,0.6)]",
        bgClass:
          "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900",
        icon: ScrollText,
      };
  }
}

function aggregateStats(certificates) {
  const totalCertificates = certificates.length;
  let meritAwards = 0;
  let totalDownloads = 0;
  let totalProfileViews = 0;

  certificates.forEach((c) => {
    if (c.type === "merit" || c.type === "winner" || c.type === "runner_up") {
      meritAwards += 1;
    }
    if (typeof c.downloadCount === "number") {
      totalDownloads += c.downloadCount;
    }
    if (typeof c.verifiedCount === "number") {
      totalProfileViews += c.verifiedCount;
    }
  });

  return {
    totalCertificates,
    meritAwards,
    totalDownloads,
    totalProfileViews,
  };
}

function buildSparklineData(monthlyVerifications = []) {
  if (!Array.isArray(monthlyVerifications) || monthlyVerifications.length === 0) {
    return [2, 3, 4, 3, 5, 4];
  }
  const sorted = [...monthlyVerifications].sort((a, b) =>
    a.month.localeCompare(b.month)
  );
  const lastSix = sorted.slice(-6);
  const counts = lastSix.map((m) => m.count || 0);
  const max = Math.max(1, ...counts);
  return counts.map((c) => (c / max) * 10 || 1);
}

function TheatreNotification({ notification, onClose, onAction }) {
  if (!notification?.visible) return null;
  const isGenerating = notification.status === "generating";

  return (
    <div className="fixed bottom-6 right-4 z-40">
      <div
        className={`w-80 rounded-2xl shadow-2xl px-5 py-4 text-sm text-white transition-transform duration-300 animate-slide-in-right ${
          isGenerating ? "bg-blue-600" : "bg-emerald-600"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {isGenerating ? (
              <span className="material-symbols-outlined text-2xl text-blue-100">
                auto_awesome
              </span>
            ) : (
              <span className="material-symbols-outlined text-2xl text-emerald-100">
                verified
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.18em] text-white/70">
              Live Generation Theatre
            </p>
            <p className="mt-1 font-semibold">
              {isGenerating ? "Generating your certificate..." : "Certificate ready!"}
            </p>
            {notification.eventTitle && (
              <p className="mt-0.5 text-xs text-white/80 line-clamp-2">
                {notification.eventTitle}
              </p>
            )}
            {isGenerating ? (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-100/90">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-100 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-100 animate-bounce [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-100 animate-bounce [animation-delay:240ms]" />
                </span>
                <span>Hang tight, almost there...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
              >
                Download now
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-1 rounded-full p-1 hover:bg-black/10"
          >
            <X className="h-4 w-4 text-white/70" />
          </button>
        </div>
      </div>
      <style>
        {`
        @keyframes slide-in-right {
          0% { opacity: 0; transform: translateX(120%); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.35s cubic-bezier(0.16,1,0.3,1);
        }
      `}
      </style>
    </div>
  );
}

function Sparkline({ data }) {
  const heights = data && data.length ? data : [2, 3, 4, 3, 5, 4];
  const width = 60;
  const barWidth = width / heights.length;

  return (
    <svg width={width} height={18} viewBox={`0 0 ${width} 18`}>
      {heights.map((h, idx) => {
        const barHeight = Math.max(2, h);
        return (
          <rect
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            x={idx * barWidth + 2}
            y={18 - barHeight}
            width={barWidth - 4}
            height={barHeight}
            rx="2"
            className="fill-blue-400/80"
          />
        );
      })}
    </svg>
  );
}

function CertificatePassportCard({
  certificate,
  onOpenViewer,
  onDownload,
  onCopyId,
  copiedId,
}) {
  const [flipped, setFlipped] = useState(false);

  const {
    type,
    snapshot = {},
    certificateId,
    verificationId,
    verifiedCount,
    monthlyVerifications,
    downloadCount,
    _id,
    eventId,
  } = certificate || {};

  const meta = getTypeMeta(type);
  const SparkIcon = meta.icon;

  const eventTitle = snapshot.eventTitle || eventId?.title || "Event";
  const clubName = snapshot.clubName || eventId?.clubName || "MITS";
  const eventDate = snapshot.eventDate || eventId?.eventDate;
  const displayId = verificationId || certificateId;

  const sparkData = useMemo(
    () => buildSparklineData(monthlyVerifications),
    [monthlyVerifications]
  );

  const handleFlip = () => {
    setFlipped((f) => !f);
  };

  return (
    <div
      className="card-container h-[280px] cursor-pointer [perspective:1000px]"
      onClick={handleFlip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleFlip();
      }}
      role="button"
      tabIndex={0}
    >
      <div
        className={`card-inner relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front */}
        <div className="card-front absolute inset-0 [backface-visibility:hidden]">
          <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-lg bg-[#161f2e] border border-[#1e2d42]">
            <div className={`relative h-[65%] ${meta.bgClass}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30" />
              <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute left-6 top-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80">
                Digital Credential
              </div>
              <div className="flex h-full items-center justify-center">
                {SparkIcon && (
                  <SparkIcon className="h-16 w-16 text-white/40 drop-shadow-xl" />
                )}
              </div>
              <span
                className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${meta.badgeClass}`}
              >
                {meta.badgeText}
              </span>
            </div>

            <div className="h-[35%] bg-white px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                {eventTitle}
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                {clubName}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {formatDate(eventDate)}
              </p>
              {displayId && (
                <p className="mt-2 text-[10px] font-mono text-slate-400 truncate">
                  ID: {displayId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="card-back absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex h-full w-full flex-col rounded-2xl bg-[#161f2e] p-5 text-white border border-[#1e2d42] shadow-xl">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
              <span>Certificate details</span>
              <span>Tap to flip back</span>
            </div>

            <div className="mt-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                Certificate ID
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="truncate font-mono text-xs text-blue-300">
                  {displayId || "—"}
                </span>
                {displayId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyId(displayId);
                    }}
                    className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-100 hover:bg-white/10"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    {copiedId === displayId ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                Recruiter views
              </p>
              <div className="mt-1 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {verifiedCount ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    times verified
                  </p>
                </div>
                <Sparkline data={sparkData} />
              </div>
            </div>

            <div className="mt-3 grid gap-2 text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(certificate);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <DownloadIcon className="h-4 w-4" />
                Download PDF
                {typeof downloadCount === "number" && (
                  <span className="ml-1 text-[10px] text-blue-100">
                    ({downloadCount})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `${CLIENT_URL}/verify/${verificationId || certificateId}`;
                  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    url
                  )}`;
                  window.open(shareUrl, "_blank", "noopener");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0077B5] px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#036198]"
              >
                <Linkedin className="h-4 w-4" />
                Add to LinkedIn
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `${CLIENT_URL}/verify/${verificationId || certificateId}`;
                  window.open(url, "_blank", "noopener");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/5"
              >
                <ExternalLink className="h-4 w-4" />
                Verify Certificate
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenViewer(certificate);
                }}
                className="mt-1 text-center text-[11px] font-medium text-slate-400 hover:text-slate-200"
              >
                View Full Screen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificateViewerModal({ certificate, onClose, onDownload }) {
  if (!certificate) return null;

  const {
    type,
    snapshot = {},
    certificateId,
    verificationId,
    pdfUrl,
    verifiedCount,
    lastVerifiedAt,
    eventId,
    createdAt,
  } = certificate;

  const meta = getTypeMeta(type);
  const eventTitle = snapshot.eventTitle || eventId?.title || "Event";
  const issuedOn = createdAt || certificate.createdAt;

  const authenticityUrl = `${CLIENT_URL}/verify/${verificationId || certificateId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4">
      <div className="max-w-5xl w-full rounded-3xl bg-white shadow-2xl overflow-hidden transform transition-all">
        <div className="flex flex-col md:flex-row h-[540px]">
          {/* Left panel */}
          <div className="relative w-full md:w-[55%] bg-slate-100">
            {pdfUrl ? (
              <iframe
                title="Certificate PDF"
                src={resolveCertificateAssetUrl(pdfUrl)}
                className="h-full w-full border-none"
              />
            ) : (
              <div
                className={`${meta.bgClass} relative flex h-full w-full flex-col items-center justify-center`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
                <meta.icon className="relative h-20 w-20 text-white/50 drop-shadow-xl" />
                <p className="relative mt-3 text-sm font-semibold text-white/90">
                  Certificate preview not available
                </p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <span className="rounded-full bg-black/40 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-100 backdrop-blur">
                Digital Certificate
              </span>
            </div>
          </div>

          {/* Right panel */}
          <div className="relative w-full md:w-[45%] p-6 md:p-7 overflow-y-auto">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {meta.badgeText}
            </div>

            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              {eventTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Issued on {formatDate(issuedOn)}
            </p>

            <div className="mt-4 rounded-xl bg-blue-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-500">
                Event Details
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {snapshot.eventCategory
                  ? `Category: ${snapshot.eventCategory}`
                  : "Official event conducted by the MITS clubs & committees."}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Hosted by {snapshot.clubName || "Madhav Institute of Technology & Science"}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-800">
                Authenticity Check
              </p>
              <p className="mt-1 text-[11px] font-mono text-slate-500 break-all">
                {verificationId || certificateId}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard?.writeText(
                      verificationId || certificateId || ""
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="h-3 w-3" />
                  Copy ID
                </button>
                <button
                  type="button"
                  onClick={() => window.open(authenticityUrl, "_blank", "noopener")}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-black"
                >
                  <Eye className="h-3 w-3" />
                  Verify
                </button>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Verified {verifiedCount ?? 0} times
                {lastVerifiedAt && (
                  <> · Last viewed {timeAgo(lastVerifiedAt)} </>
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Analytics Preview
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div>
                  <p className="text-[11px] text-slate-500">
                    Views this month
                  </p>
                  <p className="text-xl font-bold text-slate-900">
                    {verifiedCount ?? 0}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(100, (verifiedCount || 0) * 10)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                      authenticityUrl
                    )}`,
                    "_blank",
                    "noopener"
                  )
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077B5] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#036198]"
              >
                <Linkedin className="h-4 w-4" />
                Add to LinkedIn Profile
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onDownload(certificate)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: eventTitle,
                          text: "Verify my certificate from MITS.",
                          url: authenticityUrl,
                        })
                        .catch(() => {});
                    } else {
                      navigator.clipboard?.writeText(authenticityUrl);
                    }
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-[280px] rounded-2xl border border-slate-200 bg-white animate-pulse dark:border-[#1e2d42] dark:bg-[#161f2e]" />
  );
}

export default function StudentCertificates() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [stats, setStats] = useState({
    totalCertificates: 0,
    meritAwards: 0,
    totalDownloads: 0,
    totalProfileViews: 0,
  });
  const [viewerCertificate, setViewerCertificate] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [theatreNotification, setTheatreNotification] = useState(null);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/certificates/my");
      const list = res.data?.data ?? res.data ?? [];
      setCertificates(list);
      setStats(aggregateStats(list));
    } catch (e) {
      setError(e.message || "Failed to load certificates");
      setCertificates([]);
      setStats(aggregateStats([]));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  useEffect(() => {
    const current =
      activeFilter === "all"
        ? certificates
        : certificates.filter((c) => {
            if (activeFilter === "merit") {
              return c.type === "merit" || c.type === "runner_up";
            }
            if (activeFilter === "winner") {
              return c.type === "winner";
            }
            if (activeFilter === "participation") {
              return c.type === "participation";
            }
            return true;
          });
    setFiltered(current);
  }, [certificates, activeFilter]);

  const handleDownload = useCallback(async (certificate) => {
    if (!certificate?._id) return;
    try {
      const res = await api.post(`/api/certificates/${certificate._id}/download`);
      const url = res.data?.data?.pdfUrl || certificate.pdfUrl;
      if (url) {
        window.open(resolveCertificateAssetUrl(url), "_blank", "noopener");
      }
      fetchCertificates();
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.message || "Failed to download certificate");
    }
  }, [fetchCertificates]);

  const handleCopyId = useCallback((id) => {
    if (!id) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(id).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const hasCertificates = !loading && !error && filtered.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0d1117] dark:text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mx-2 grid gap-4 md:mx-0 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur dark:border-[#1e2d42] dark:bg-[#161f2e] dark:shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                  Total Certificates
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalCertificates}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur dark:border-[#1e2d42] dark:bg-[#161f2e] dark:shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                  Merit Awards
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.meritAwards}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-500 dark:bg-amber-400/20 dark:text-amber-200">
                <Award className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur dark:border-[#1e2d42] dark:bg-[#161f2e] dark:shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                  Total Downloads
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalDownloads}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
                <DownloadIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur dark:border-[#1e2d42] dark:bg-[#161f2e] dark:shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                  Profile Views
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalProfileViews}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-200">
                <Eye className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mx-2 mt-2 flex flex-wrap gap-2 md:mx-0">
          {[
            { id: "all", label: "All" },
            { id: "merit", label: "Merit" },
            { id: "participation", label: "Participation" },
            { id: "winner", label: "Winner" },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-primary-600 bg-primary-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grid / states */}
        <div className="mt-4">
          {loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <SkeletonCard key={idx} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mt-12 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-5xl text-slate-600">
                error
              </span>
              <p className="mt-3 text-sm text-slate-300">{error}</p>
            </div>
          )}

          {!loading && !error && certificates.length === 0 && (
            <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <ScrollText className="h-14 w-14 text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                No certificates yet
              </p>
              <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Participate in events and complete activities to earn your first
                verifiable certificate.
              </p>
              <button
                type="button"
                onClick={() => navigate("/student/events")}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
              >
                <span className="material-symbols-outlined text-base">
                  travel_explore
                </span>
                Browse Events
              </button>
            </div>
          )}

          {!loading && !error && certificates.length > 0 && filtered.length === 0 && (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                No certificates match this filter
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Try another category or choose &quot;All&quot;.
              </p>
            </div>
          )}

          {hasCertificates && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((cert) => (
                <CertificatePassportCard
                  key={cert._id}
                  certificate={cert}
                  onOpenViewer={setViewerCertificate}
                  onDownload={handleDownload}
                  onCopyId={handleCopyId}
                  copiedId={copiedId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <TheatreNotification
        notification={theatreNotification}
        onClose={() => setTheatreNotification(null)}
        onAction={() => {
          fetchCertificates();
          setTheatreNotification(null);
        }}
      />

      {viewerCertificate && (
        <CertificateViewerModal
          certificate={viewerCertificate}
          onClose={() => setViewerCertificate(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}

