import React, { useCallback, useMemo, useState } from "react";
import { ClipboardCheck, Download } from "lucide-react";
import useEventAttendance, {
  scanAttendance,
  manualMarkAttendance,
  exportAttendanceCsv,
} from "../../hooks/useEventAttendance";
import AttendanceStats from "./AttendanceStats";
import EventLoader from "./EventLoader";
import QRScannerCard from "./QRScannerCard";
import AttendanceTable from "./AttendanceTable";

export default function AttendancePanel() {
  const [activeEventId, setActiveEventId] = useState("");
  const [lastScanToken, setLastScanToken] = useState("");
  const [isScanSubmitting, setIsScanSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // all | pending | present

  const { data, loading, error, refetch } = useEventAttendance(activeEventId);

  const totals = data?.totals;
  const event = data?.event;
  const participants = data?.participants || [];

  const handleLoadEvent = useCallback((id) => {
    const trimmed = String(id || "").trim();
    if (!trimmed) return;
    setActiveEventId(trimmed);
  }, []);

  const handleExport = useCallback(async () => {
    if (!activeEventId) return;
    await exportAttendanceCsv(activeEventId);
  }, [activeEventId]);

  const handleSubmitScanToken = useCallback(
    async (rawToken) => {
      const token = String(rawToken || "").trim();
      if (!token || isScanSubmitting || token === lastScanToken) {
        return { success: false, message: "Invalid or duplicate QR token." };
      }

      setIsScanSubmitting(true);
      let response;
      try {
        response = await scanAttendance(token);
        if (response?.success) {
          setLastScanToken(token);
          const displayName = response.data?.user?.name || "Participant";
          const displayEmail = response.data?.user?.email || "";
          const eventIdForRefetch = response.data?.eventId || activeEventId;
          if (eventIdForRefetch) {
            await refetch(eventIdForRefetch);
          }
          return {
            success: true,
            message: `Marked present: ${displayName}${
              displayEmail ? ` (${displayEmail})` : ""
            }`,
          };
        }
        return {
          success: false,
          message: response?.message || "Unable to scan QR token",
        };
      } catch (err) {
        return {
          success: false,
          message: err?.message || "Unable to scan QR token",
        };
      } finally {
        setIsScanSubmitting(false);
      }
    },
    [activeEventId, isScanSubmitting, lastScanToken, refetch]
  );

  const handleManualMark = useCallback(
    async (registrationId) => {
      if (!registrationId) return;
      const res = await manualMarkAttendance(registrationId);
      if (res.success && (activeEventId || res.data?.eventId)) {
        await refetch(res.data?.eventId || activeEventId);
      }
      return res;
    },
    [activeEventId, refetch]
  );

  const derivedTotals = useMemo(() => {
    if (!totals) return null;
    const registered = totals.totalRegistered ?? 0;
    const present = totals.totalPresent ?? 0;
    const absentFromBackend = totals.totalAbsent ?? null;
    const pending =
      totals.totalPending ?? (absentFromBackend != null ? absentFromBackend : Math.max(registered - present, 0));
    const percentage =
      typeof totals.attendancePercentage === "number"
        ? totals.attendancePercentage
        : registered > 0
        ? Math.round((present / registered) * 100)
        : 0;

    return {
      registered,
      present,
      pending,
      percentage,
    };
  }, [totals]);

  const processedParticipants = useMemo(() => {
    const list = Array.isArray(participants) ? [...participants] : [];
    const term = search.trim().toLowerCase();

    const filteredBySearch = term
      ? list.filter((p) =>
          [p.name, p.email, p.studentId, p.userId]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(term))
        )
      : list;

    const filteredByStatus =
      statusFilter === "all"
        ? filteredBySearch
        : filteredBySearch.filter((p) => {
            const value = String(p.status || "").toLowerCase();
            if (statusFilter === "present") {
              return value === "present" || value === "checked_in";
            }
            // pending filter: anything not present
            return !(value === "present" || value === "checked_in");
          });

    const getCheckInDate = (p) => {
      const raw =
        p.checkInTime ||
        p.attendanceMarkedAt ||
        p.attendedAt ||
        p.updatedAt ||
        p.presentAt ||
        p.registeredAt;
      if (!raw) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    return filteredByStatus.sort((a, b) => {
      const aDate = getCheckInDate(a);
      const bDate = getCheckInDate(b);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return bDate.getTime() - aDate.getTime();
    });
  }, [participants, search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d1117] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Attendance Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Monitor live check-ins, manage QR scanning, and export attendance like a modern
              SaaS admin.
            </p>
          </div>
          {activeEventId && (
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-[#1e2d42] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </header>

        {/* Event banner + stats / loading skeleton */}
        {loading && !event ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-[#161f2e] p-6 shadow-lg ring-1 ring-slate-100 dark:ring-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-[#161f2e]" />
                <div className="space-y-2">
                  <div className="h-3 w-32 rounded-full bg-slate-100 dark:bg-[#161f2e]" />
                  <div className="h-4 w-44 rounded-full bg-slate-100 dark:bg-[#161f2e]" />
                  <div className="h-3 w-40 rounded-full bg-slate-100 dark:bg-[#161f2e]" />
                </div>
              </div>
            </div>
            <AttendanceStats totals={null} loading />
          </div>
        ) : event ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-[#161f2e] p-6 shadow-lg ring-1 ring-slate-100 dark:ring-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-200">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Active Event
                  </p>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    {event.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {event.location} •{" "}
                    {event.eventDate
                      ? new Date(event.eventDate).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Date TBA"}
                  </p>
                  {derivedTotals && (
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-700 ring-1 ring-slate-100 dark:bg-[#161f2e] dark:text-slate-200 dark:ring-slate-700">
                        <span>Registered:</span>
                        <span className="font-semibold tabular-nums">
                          {derivedTotals.registered}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-200 dark:ring-emerald-900/50">
                        <span>Checked in:</span>
                        <span className="font-semibold tabular-nums">
                          {derivedTotals.present}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-700 ring-1 ring-rose-100 dark:bg-rose-900/20 dark:text-rose-200 dark:ring-rose-900/50">
                        <span>Pending:</span>
                        <span className="font-semibold tabular-nums">
                          {derivedTotals.pending}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700 ring-1 ring-sky-100 dark:bg-sky-900/20 dark:text-sky-200 dark:ring-sky-900/50">
                        <span>Rate:</span>
                        <span className="font-semibold tabular-nums">
                          {derivedTotals.percentage}%
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {activeEventId && (
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 sm:mt-0">
                  Event ID: <span className="font-mono">{activeEventId}</span>
                </p>
              )}
            </div>

            {derivedTotals && (
              <AttendanceStats totals={derivedTotals} loading={loading} />
            )}
          </div>
        ) : (
          !error && (
            <div className="rounded-2xl bg-white dark:bg-[#161f2e] p-6 text-sm text-slate-500 dark:text-slate-400 shadow-lg ring-1 ring-dashed ring-slate-200 dark:ring-slate-800">
              Load an event to start tracking attendance. The dashboard will populate with live
              stats, QR scanning, and a real-time attendee table.
            </div>
          )
        )}

        {/* Grid: Event loader + QR scanner */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)]">
          <EventLoader
            activeEventId={activeEventId}
            onLoadEvent={handleLoadEvent}
            loading={loading}
            error={error}
          />
          <QRScannerCard
            disabled={!activeEventId}
            onSubmitToken={handleSubmitScanToken}
            isSubmitting={isScanSubmitting}
          />
        </div>

        {/* Live attendance table */}
        <AttendanceTable
          participants={processedParticipants}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onManualMark={handleManualMark}
          onBulkMark={async (ids) => {
            if (!ids || !ids.length) return;
            // run manual marks, then a single refetch for fresher stats
            for (const id of ids) {
              // ignore individual failures; they can be surfaced from API responses later
              // eslint-disable-next-line no-await-in-loop
              await manualMarkAttendance(id);
            }
            if (activeEventId) {
              await refetch(activeEventId);
            }
          }}
        />
      </div>
    </div>
  );
}

