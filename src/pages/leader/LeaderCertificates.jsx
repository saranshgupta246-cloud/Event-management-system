import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Award,
  Download as DownloadIcon,
  Eye,
  GraduationCap,
  ScrollText,
  Star,
} from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

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

function getTypeMeta(type) {
  switch (type) {
    case "winner":
    case "winner_1st":
    case "winner_2nd":
    case "winner_3rd":
      return {
        label: "Winner",
        badgeText: "🥇 Winner",
        badgeClass:
          "bg-amber-400 text-amber-900 shadow-[0_0_0_1px_rgba(146,64,14,0.4)]",
        bgClass:
          "bg-gradient-to-br from-amber-500 via-yellow-300 to-amber-700",
        icon: Award,
      };
    case "merit":
    case "runner_up":
      return {
        label: type === "runner_up" ? "Runner Up" : "Merit",
        badgeText: "⭐ Merit",
        badgeClass:
          "bg-blue-500 text-white shadow-[0_0_0_1px_rgba(30,64,175,0.5)]",
        bgClass:
          "bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700",
        icon: Star,
      };
    default:
      return {
        label: "Participation",
        badgeText: "✓ Participation",
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
  let totalDownloads = 0;
  let totalProfileViews = 0;

  certificates.forEach((c) => {
    if (typeof c.downloadCount === "number") {
      totalDownloads += c.downloadCount;
    }
    if (typeof c.verifiedCount === "number") {
      totalProfileViews += c.verifiedCount;
    }
  });

  return {
    totalCertificates,
    totalDownloads,
    totalProfileViews,
  };
}

function CertificatePassportCard({
  certificate,
  onDownload,
}) {
  const {
    type,
    snapshot = {},
    certificateId,
    verificationId,
    downloadCount,
    _id,
    eventId,
  } = certificate || {};

  const meta = getTypeMeta(type);
  const SparkIcon = meta.icon;

  const eventTitle = snapshot.eventTitle || eventId?.title || "Event";
  const clubName = snapshot.clubName || eventId?.clubName || "MITS";
  const eventDate = snapshot.eventDate || eventId?.eventDate;
  const displayId = verificationId || certificateId || _id;

  const authenticityUrl = `${CLIENT_URL}/verify/${verificationId || certificateId || _id}`;

  return (
    <div className="card-container h-[260px] cursor-pointer [perspective:1000px]">
      <div className="card-inner relative h-full w-full">
        <div className="card-front absolute inset-0 [backface-visibility:hidden]">
          <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-lg bg-slate-900/60 border border-white/10">
            <div className={`relative h-[65%] ${meta.bgClass}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30" />
              <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute left-6 top-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80">
                Issued Certificate
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

        {/* Simple back with actions */}
        <div className="card-back absolute inset-0 [backface-visibility:hidden]">
          <div className="flex h-full w-full flex-col rounded-2xl bg-slate-900 p-5 text-white border border-white/10 shadow-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">
              Certificate Actions
            </p>
            <p className="mt-2 text-xs text-slate-300">
              Download the PDF or open the public verification profile for this
              certificate.
            </p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => onDownload(certificate)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
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
                onClick={() => window.open(authenticityUrl, "_blank", "noopener")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-800"
              >
                <Eye className="h-4 w-4" />
                Open Verification Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderCertificates() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [stats, setStats] = useState({
    totalCertificates: 0,
    totalDownloads: 0,
    totalProfileViews: 0,
  });

  const eventId = searchParams.get("eventId");

  const fetchCertificates = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      setCertificates([]);
      setStats(aggregateStats([]));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/certificates/events/${eventId}`);
      const list = res.data?.data ?? res.data ?? [];
      const arr = Array.isArray(list) ? list : [];
      setCertificates(arr);
      setStats(aggregateStats(arr));
    } catch (e) {
      setError(e.message || "Failed to load certificates for this event");
      setCertificates([]);
      setStats(aggregateStats([]));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

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
              return (
                c.type === "winner" ||
                c.type === "winner_1st" ||
                c.type === "winner_2nd" ||
                c.type === "winner_3rd"
              );
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
        window.open(url, "_blank", "noopener");
      }
      fetchCertificates();
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.message || "Failed to download certificate");
    }
  }, [fetchCertificates]);

  const headerName = user?.name || "Organizer";
  const avatarLetter = headerName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasCertificates = !loading && !error && filtered.length > 0;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      style={{
        fontFamily:
          "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 sm:flex-row sm:items-center sm:px-8 sm:py-8 shadow-[0_18px_40px_rgba(15,23,42,0.7)]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
              Issued Certificates
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Event Certificates
            </h1>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              View all certificates issued for this event and track how many times
              they have been downloaded or verified.
            </p>
            {!eventId && (
              <p className="mt-3 text-xs text-amber-300">
                No event selected. Open{" "}
                <button
                  type="button"
                  onClick={() => navigate("/leader/events")}
                  className="underline underline-offset-2"
                >
                  Events
                </button>{" "}
                and choose &quot;View certificates&quot; for a specific event.
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-slate-900/70 px-4 py-3 border border-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400 bg-slate-800 text-xl font-semibold text-amber-200 shadow-lg">
                {avatarLetter}
              </div>
              <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 px-1.5 py-[1px] text-[9px] font-semibold text-white shadow">
                Leader
              </span>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-white">{headerName}</p>
              <p className="text-[11px] text-slate-400">
                Club certificates overview
              </p>
              {eventId && (
                <p className="text-[11px] text-slate-400">
                  Event ID:{" "}
                  <span className="font-mono text-[10px] text-slate-300">
                    {eventId}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-2 grid gap-4 md:mx-0 md:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Total Issued
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {stats.totalCertificates}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Downloads
                </p>
                <p className="mt-2 text-2xl font-bold">{stats.totalDownloads}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">
                <DownloadIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Verifications
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {stats.totalProfileViews}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
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
                    ? "border-white bg-white text-slate-900"
                    : "border-transparent bg-white/0 text-slate-400 hover:bg-white/10 hover:text-white"
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
                <div
                  key={idx}
                  className="h-[260px] rounded-2xl bg-white/10 border border-white/10 animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mt-12 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-5xl text-slate-400">
                error
              </span>
              <p className="mt-3 text-sm text-slate-200">{error}</p>
            </div>
          )}

          {!loading && !error && !eventId && (
            <div className="mt-12 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-6xl text-slate-500">
                script
              </span>
              <p className="mt-4 text-xl font-bold text-white">
                Select an event to view certificates
              </p>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Go to the Events tab and open the certificates view for a specific
                event to see issued certificates here.
              </p>
              <button
                type="button"
                onClick={() => navigate("/leader/events")}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
              >
                <span className="material-symbols-outlined text-base">
                  event
                </span>
                Go to Events
              </button>
            </div>
          )}

          {!loading && !error && eventId && !hasCertificates && (
            <div className="mt-12 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-6xl text-slate-500">
                script
              </span>
              <p className="mt-4 text-xl font-bold text-white">
                No certificates issued yet
              </p>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Once certificates are generated for this event, they will appear in this
                view for quick access and analytics.
              </p>
            </div>
          )}

          {hasCertificates && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((cert) => (
                <CertificatePassportCard
                  key={cert._id}
                  certificate={cert}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

