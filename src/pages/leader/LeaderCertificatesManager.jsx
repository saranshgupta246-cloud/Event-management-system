import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, RefreshCw, Rocket } from "lucide-react";
import api from "../../services/api";
import { resolveCertificateAssetUrl } from "../../utils/certificateUrls";
import { isEventApproved } from "../../utils/eventApproval";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function winnerSelectToPatch(value) {
  if (value === "winner_1st") return { type: "winner", rank: "1st" };
  if (value === "winner_2nd") return { type: "winner", rank: "2nd" };
  if (value === "winner_3rd") return { type: "winner", rank: "3rd" };
  if (value === "winner") return { type: "winner", rank: null };
  if (value === "merit") return { type: "merit", rank: null };
  return { type: "participation", rank: null };
}

function normalizeSuggestedType(raw) {
  const v = String(raw || "participation").toLowerCase();
  if (v.startsWith("winner")) return "winner";
  if (v.includes("merit") || v.includes("runner")) return "merit";
  return "participation";
}

export default function LeaderCertificatesManager() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");

  const selectedEventId = searchParams.get("eventId") || "";
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [eligible, setEligible] = useState([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [eligibleError, setEligibleError] = useState("");

  const [certs, setCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [certsError, setCertsError] = useState("");

  const [savingOverrides, setSavingOverrides] = useState(false);
  const [updatingCertId, setUpdatingCertId] = useState(null);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError("");
    try {
      const res = await api.get("/api/leader/events");
      const list = Array.isArray(res.data?.data) ? res.data.data.filter(isEventApproved) : [];
      setEvents(list);
    } catch (e) {
      setEvents([]);
      setEventsError(e.response?.data?.message || e.message || "Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEvent(null);
      return;
    }
    const ev = events.find((e) => String(e._id) === String(selectedEventId));
    setSelectedEvent(ev || null);
  }, [events, selectedEventId]);

  // Default-select first event once loaded
  useEffect(() => {
    if (eventsLoading) return;
    if (selectedEventId) return;
    if (events.length === 0) return;
    setSearchParams({ eventId: String(events[0]._id) }, { replace: true });
  }, [events, eventsLoading, selectedEventId, setSearchParams]);

  const fetchEligible = useCallback(async () => {
    if (!selectedEventId) return;
    setEligibleLoading(true);
    setEligibleError("");
    try {
      const res = await api.get(`/api/certificates/events/${selectedEventId}/eligible`);
      const payload = res.data?.data || {};
      const rows = (Array.isArray(payload.eligible) ? payload.eligible : []).map((s) => ({
        id: String(s._id),
        name: s.name || "Student",
        email: s.email || "",
        rollNo: s.rollNo || "—",
        suggestion: normalizeSuggestedType(s.suggestion),
        overrideType: normalizeSuggestedType(s.suggestion),
        status: s.hasCertificate ? "generated" : "pending",
      }));
      setEligible(rows);
    } catch (e) {
      setEligible([]);
      setEligibleError(e.response?.data?.message || e.message || "Failed to load eligible students");
    } finally {
      setEligibleLoading(false);
    }
  }, [selectedEventId]);

  const fetchCerts = useCallback(async () => {
    if (!selectedEventId) return;
    setCertsLoading(true);
    setCertsError("");
    try {
      const res = await api.get(`/api/certificates/events/${selectedEventId}?limit=100&page=1`);
      const items = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];
      setCerts(items);
    } catch (e) {
      setCerts([]);
      setCertsError(e.response?.data?.message || e.message || "Failed to load certificates");
    } finally {
      setCertsLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
    fetchEligible();
    fetchCerts();
  }, [selectedEventId, fetchEligible, fetchCerts]);

  const generatedCount = useMemo(
    () => eligible.filter((s) => s.status === "generated").length,
    [eligible]
  );

  const handleGenerate = async () => {
    if (!selectedEventId) return;
    setSavingOverrides(true);
    try {
      const payload = {
        trigger: "manual",
        automationMode: "auto",
        recipients: eligible.map((s) => ({
          studentId: s.id,
          type: s.overrideType,
          selected: true,
        })),
      };
      await api.post(`/api/certificates/events/${selectedEventId}/generate`, payload);
      // Refresh after a short delay (generation is async)
      setTimeout(() => {
        fetchEligible();
        fetchCerts();
      }, 1200);
    } finally {
      setSavingOverrides(false);
    }
  };

  const patchCertificateType = async (certId, value) => {
    const { type, rank } = winnerSelectToPatch(value);
    setUpdatingCertId(certId);
    try {
      await api.patch(`/api/certificates/${certId}/type`, { type, rank });
      await fetchCerts();
    } finally {
      setUpdatingCertId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0d1117] dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage certificate generation and winners for your club events.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchEvents}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Select event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSearchParams({ eventId: e.target.value }, { replace: true })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-100"
              >
                {eventsLoading && <option value="">Loading events...</option>}
                {!eventsLoading && events.length === 0 && <option value="">No events found</option>}
                {!eventsLoading &&
                  events.map((e) => (
                    <option key={e._id} value={String(e._id)}>
                      {e.title} · {formatDate(e.eventDate)} · {e.status}
                    </option>
                  ))}
              </select>
              {eventsError && (
                <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{eventsError}</p>
              )}
            </div>

            <button
              type="button"
              disabled={!selectedEventId}
              onClick={() =>
                navigate(`/leader/events/${encodeURIComponent(selectedEventId)}/certificates`, {
                  state: { eventTitle: selectedEvent?.title || "Selected Event" },
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Open distribution
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {selectedEvent && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#1e2d42] dark:bg-[#1a2436]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Confirmed
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedEvent.confirmedRegistrations ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#1e2d42] dark:bg-[#1a2436]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Generated
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedEvent.certificatesGenerated ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#1e2d42] dark:bg-[#1a2436]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Eligible loaded
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {eligible.length}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-[#1e2d42]">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Eligible students</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Suggestions default to Winner/Merit/Participation. Set winner ranks if needed.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchEligible}
                  disabled={!selectedEventId || eligibleLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {eligibleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Reload
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!selectedEventId || eligible.length === 0 || savingOverrides}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {savingOverrides ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  Generate
                </button>
              </div>
            </div>

            <div className="max-h-[560px] overflow-auto">
              {eligibleError && (
                <div className="px-5 py-4 text-sm text-rose-600 dark:text-rose-400">
                  {eligibleError}
                </div>
              )}
              {!eligibleLoading && !eligibleError && eligible.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No eligible students found.
                </div>
              )}
              {eligibleLoading && (
                <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  Loading...
                </div>
              )}

              {eligible.length > 0 && (
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-[#161f2e] dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Roll</th>
                      <th className="px-5 py-3">Suggested</th>
                      <th className="px-5 py-3">Override</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d42]">
                    {eligible.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="px-5 py-3">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {s.name}
                          </div>
                          {s.email && (
                            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              {s.email}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {s.rollNo}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                          {s.suggestion}
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={s.overrideType}
                            onChange={(e) =>
                              setEligible((prev) =>
                                prev.map((x) => (x.id === s.id ? { ...x, overrideType: e.target.value } : x))
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-100"
                          >
                            <option value="participation">Participation</option>
                            <option value="merit">Merit</option>
                            <option value="winner">Winner</option>
                            <option value="winner_1st">Winner (1st)</option>
                            <option value="winner_2nd">Winner (2nd)</option>
                            <option value="winner_3rd">Winner (3rd)</option>
                          </select>
                        </td>
                        <td className="px-5 py-3 text-xs">
                          {s.status === "generated" ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                              generated
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-[#1e2d42]/60 dark:text-slate-300">
                              pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {eligible.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-[#1e2d42] dark:text-slate-400">
                {generatedCount}/{eligible.length} already have certificates.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-[#1e2d42]">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Issued certificates</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Update type/rank and download PDFs.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchCerts}
                disabled={!selectedEventId || certsLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {certsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Reload
              </button>
            </div>

            <div className="max-h-[560px] overflow-auto">
              {certsError && (
                <div className="px-5 py-4 text-sm text-rose-600 dark:text-rose-400">{certsError}</div>
              )}
              {!certsLoading && !certsError && certs.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No certificates issued yet.
                </div>
              )}
              {certsLoading && (
                <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  Loading...
                </div>
              )}

              {certs.length > 0 && (
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-[#161f2e] dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d42]">
                    {certs.map((c) => {
                      const name = c.snapshot?.studentName || c.studentId?.name || "Student";
                      const email = c.snapshot?.studentEmail || c.studentId?.email || "";
                      const typeValue =
                        c.type === "winner" && c.rank
                          ? `winner_${String(c.rank).toLowerCase()}`
                          : c.type === "winner"
                          ? "winner"
                          : c.type === "merit"
                          ? "merit"
                          : "participation";
                      const isUpdating = updatingCertId === c._id;
                      return (
                        <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="px-5 py-3">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {name}
                            </div>
                            {email && (
                              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                {email}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <select
                              value={typeValue}
                              disabled={isUpdating}
                              onChange={(e) => patchCertificateType(c._id, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600/20 disabled:opacity-60 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-100"
                            >
                              <option value="participation">Participation</option>
                              <option value="merit">Merit</option>
                              <option value="winner">Winner</option>
                              <option value="winner_1st">Winner (1st)</option>
                              <option value="winner_2nd">Winner (2nd)</option>
                              <option value="winner_3rd">Winner (3rd)</option>
                            </select>
                            {isUpdating && (
                              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <Loader2 className="inline h-3.5 w-3.5 animate-spin align-[-2px]" /> Updating...
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                            {c.status || "—"}
                          </td>
                          <td className="px-5 py-3 text-xs">
                            {c.pdfUrl ? (
                              <a
                                href={resolveCertificateAssetUrl(c.pdfUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                              >
                                Open <ArrowRight className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

