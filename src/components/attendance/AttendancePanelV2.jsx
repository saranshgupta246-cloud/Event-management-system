import React, { useMemo, useState } from "react";
import {
  ClipboardCheck,
  RefreshCcw,
  QrCode,
  Download,
  AlertCircle,
  Camera,
  CameraOff,
  Search,
  CheckSquare,
} from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import useEventAttendance, {
  scanAttendance,
  manualMarkAttendance,
  exportAttendanceCsv,
} from "../../hooks/useEventAttendance";

function StatusBadge({ status }) {
  const value = (status || "").toLowerCase();
  if (value === "present") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        Present
      </span>
    );
  }
  if (value === "absent") {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
        Absent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
      Registered
    </span>
  );
}

export default function AttendancePanelV2() {
  const [eventIdInput, setEventIdInput] = useState("");
  const [activeEventId, setActiveEventId] = useState("");
  const [scanToken, setScanToken] = useState("");
  const [scannerEnabled, setScannerEnabled] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [scanMessage, setScanMessage] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const { data, loading, error, refetch } = useEventAttendance(activeEventId);

  const handleLoadEvent = (e) => {
    e.preventDefault();
    const trimmed = eventIdInput.trim();
    if (!trimmed) return;
    setActiveEventId(trimmed);
    setSelectedIds([]);
    setBulkResult(null);
  };

  const scanWithToken = async (token) => {
    if (!token) return;
    setScanMessage(null);
    setScanError(null);
    const res = await scanAttendance(token);
    if (res.success) {
      setScanMessage(
        `Marked present: ${res.data?.user?.name || "Participant"} (${res.data?.user?.email || ""})`
      );
      if (activeEventId || res.data?.eventId) {
        await refetch(res.data?.eventId || activeEventId);
      }
      setSelectedIds([]);
    } else {
      setScanError(res.message || "Unable to scan QR token");
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    const token = scanToken.trim();
    if (!token) return;
    await scanWithToken(token);
  };

  const handleCameraScan = async (codes) => {
    if (!Array.isArray(codes) || codes.length === 0) return;
    const token = codes[0]?.rawValue?.trim();
    if (!token || scannerBusy) return;
    setScannerBusy(true);
    setScannerError(null);
    await scanWithToken(token);
    setScannerBusy(false);
  };

  const handleManualMark = async (registrationId) => {
    if (!registrationId) return;
    setActionLoadingId(registrationId);
    const res = await manualMarkAttendance(registrationId);
    setActionLoadingId(null);
    if (res.success && (activeEventId || res.data?.eventId)) {
      refetch(res.data?.eventId || activeEventId);
      setSelectedIds((prev) => prev.filter((id) => id !== registrationId));
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (!activeEventId) return;
    await exportAttendanceCsv(activeEventId);
  };

  const totals = data?.totals;
  const event = data?.event;
  const participants = data?.participants || [];

  const filteredParticipants = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return participants;
    return participants.filter((p) =>
      [p.name, p.email, p.studentId, p.userId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [participants, search]);

  const allPageSelectable = filteredParticipants
    .filter((p) => String(p.status).toLowerCase() !== "present")
    .map((p) => p.id);
  const allPageSelected =
    allPageSelectable.length > 0 &&
    allPageSelectable.every((id) => selectedIds.includes(id));

  const handleSelectAllOnPage = () => {
    if (allPageSelectable.length === 0) {
      setSelectedIds([]);
      return;
    }

    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allPageSelectable.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...allPageSelectable])));
  };

  const handleBulkMarkPresent = async () => {
    if (selectedIds.length === 0 || bulkLoading) return;
    setBulkLoading(true);
    setBulkResult(null);

    const results = await Promise.all(
      selectedIds.map(async (id) => {
        const res = await manualMarkAttendance(id);
        return { id, success: !!res.success, message: res.message };
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);
    setBulkResult({
      successCount,
      failCount: failed.length,
      failMessage: failed[0]?.message || null,
    });
    setSelectedIds([]);
    setBulkLoading(false);
    if (successCount > 0) {
      await refetch(activeEventId);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            Event Attendance
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Load an event by ID, then use camera QR check-in or manual attendance.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <form
          onSubmit={handleLoadEvent}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Step 1 • Select Event
          </p>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Event ID (Mongo ObjectId)
          </label>
          <input
            type="text"
            value={eventIdInput}
            onChange={(e) => setEventIdInput(e.target.value)}
            placeholder="Paste eventId from backend"
            className="mb-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!eventIdInput.trim()}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Load Event
          </button>
          {error && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </form>

        <form
          onSubmit={handleScan}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Step 2 • QR Check-in
          </p>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            QR Code Token
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={scanToken}
              onChange={(e) => setScanToken(e.target.value)}
              placeholder="Scan or paste QR token"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
              disabled={!scanToken.trim()}
            >
              <QrCode className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setScannerEnabled((prev) => !prev);
                setScannerError(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {scannerEnabled ? (
                <>
                  <CameraOff className="h-3.5 w-3.5" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="h-3.5 w-3.5" />
                  Start Camera
                </>
              )}
            </button>
            {scannerBusy && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Processing scan...
              </span>
            )}
          </div>
          {scannerEnabled && (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <Scanner
                constraints={{ facingMode: "environment" }}
                onScan={handleCameraScan}
                onError={(err) => {
                  const msg = err?.message || "Unable to access camera";
                  setScannerError(msg);
                }}
                styles={{ container: { width: "100%" } }}
              />
            </div>
          )}
          {scannerError && (
            <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400">{scannerError}</p>
          )}
          {scanMessage && (
            <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400">
              {scanMessage}
            </p>
          )}
          {scanError && (
            <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400">
              {scanError}
            </p>
          )}
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Step 3 • Export
          </p>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Download a CSV of all registered participants and their attendance status.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={!activeEventId}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </button>
          {activeEventId && (
            <p className="mt-2 truncate text-[11px] text-slate-400">
              Event: <span className="font-mono">{activeEventId}</span>
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
          Loading attendance data...
        </div>
      )}

      {event && !loading && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Active Event
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
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
                </div>
              </div>
              {totals && (
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wide">Registered</p>
                    <p className="text-sm font-bold">{totals.totalRegistered}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <p className="text-[10px] font-semibold uppercase tracking-wide">Present</p>
                    <p className="text-sm font-bold">{totals.totalPresent}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <p className="text-[10px] font-semibold uppercase tracking-wide">Absent</p>
                    <p className="text-sm font-bold">{totals.totalAbsent}</p>
                  </div>
                  <div className="rounded-xl bg-slate-900 px-3 py-2 text-slate-50 dark:bg-slate-100 dark:text-slate-900">
                    <p className="text-[10px] font-semibold uppercase tracking-wide">
                      Attendance Rate
                    </p>
                    <p className="text-sm font-bold">{totals.attendancePercentage}%</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span>Participants</span>
              <span>{filteredParticipants.length} records</span>
            </div>
            <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-xs">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, student ID..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllOnPage}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    {allPageSelected ? "Unselect Page" : "Select Page"}
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkMarkPresent}
                    disabled={selectedIds.length === 0 || bulkLoading}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {bulkLoading
                      ? "Marking..."
                      : `Mark Selected Present (${selectedIds.length})`}
                  </button>
                </div>
              </div>
              {bulkResult && (
                <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300">
                  Updated {bulkResult.successCount} participant(s)
                  {bulkResult.failCount > 0
                    ? `, ${bulkResult.failCount} failed${
                        bulkResult.failMessage ? ` (${bulkResult.failMessage})` : ""
                      }`
                    : ""}
                  .
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-2.5 w-10">#</th>
                    <th className="px-5 py-2.5">Name</th>
                    <th className="px-5 py-2.5">Email</th>
                    <th className="px-5 py-2.5">Student ID</th>
                    <th className="px-5 py-2.5">Registered At</th>
                    <th className="px-5 py-2.5">Attendance</th>
                    <th className="px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                  {filteredParticipants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelection(p.id)}
                          disabled={String(p.status).toLowerCase() === "present"}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary/30 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                            {(p.name || "?")
                              .split(" ")
                              .filter(Boolean)
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-50">
                              {p.name || "Unknown"}
                            </p>
                            <p className="text-[11px] text-slate-500">{p.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                        {p.email}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                        {p.studentId || "—"}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                        {p.registeredAt
                          ? new Date(p.registeredAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-5 py-2.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {p.status !== "present" ? (
                          <button
                            type="button"
                            onClick={() => handleManualMark(p.id)}
                            disabled={actionLoadingId === p.id}
                            className="inline-flex items-center justify-center rounded-full border border-emerald-500 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                          >
                            {actionLoadingId === p.id ? "Updating..." : "Mark Present"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Already marked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredParticipants.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                      >
                        {participants.length === 0
                          ? "No registrations found for this event yet."
                          : "No participants match this search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!event && !loading && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
          Paste an <span className="font-mono text-xs font-semibold">eventId</span> from your
          backend and click <span className="font-semibold">Load Event</span> to start tracking
          attendance.
        </div>
      )}
    </div>
  );
}

