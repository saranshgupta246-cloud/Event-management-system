import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  bulkRemoveEventParticipants,
  downloadEventParticipantsCsv,
  listEventParticipants,
  removeEventParticipant,
} from "../../hooks/useAdminEvents";
import { eventRouteSegment, feeForRegistrationType } from "../../utils/eventRoutes";

export default function AdminEventParticipants() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState([]);
  const [event, setEvent] = useState(null);
  const [selected, setSelected] = useState([]);

  const regTypes = event?.registrationTypes?.length ? event.registrationTypes : ["solo"];
  const isPaid = regTypes.some((t) => feeForRegistrationType(event, t) > 0);
  const segment = event ? eventRouteSegment(event) || eventId : eventId;

  const fetchRows = async () => {
    setLoading(true);
    const res = await listEventParticipants(eventId, { search, status, page: 1, limit: 100 });
    if (res?.success) {
      setRows(res.data.items || []);
      setEvent(res.data.event || null);
      setError("");
    } else {
      setError(res?.message || "Failed to load participants.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, status]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const name = row?.user?.name?.toLowerCase() || "";
      const email = row?.user?.email?.toLowerCase() || "";
      const utr = String(row?.utrNumber || "").toLowerCase();
      return name.includes(q) || email.includes(q) || utr.includes(q);
    });
  }, [rows, search]);

  const toggleAll = () => {
    if (selected.length === filteredRows.length) {
      setSelected([]);
    } else {
      setSelected(filteredRows.map((r) => r._id));
    }
  };

  const removeOne = async (id) => {
    const res = await removeEventParticipant(id);
    if (!res?.success) {
      setError(res?.message || "Failed to remove participant.");
      return;
    }
    setSelected((prev) => prev.filter((x) => x !== id));
    fetchRows();
  };

  const removeBulk = async () => {
    if (selected.length === 0) return;
    const res = await bulkRemoveEventParticipants(eventId, selected);
    if (!res?.success) {
      setError(res?.message || "Bulk remove failed.");
      return;
    }
    setSelected([]);
    fetchRows();
  };

  const downloadCsv = async () => {
    const res = await downloadEventParticipantsCsv(eventId);
    if (!res?.success || !res.blob) {
      setError(res?.message || "CSV download failed.");
      return;
    }
    const url = URL.createObjectURL(res.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.title || "event"}-participants.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page-shell flex flex-1 flex-col min-w-0 overflow-x-hidden">
      <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to={`/admin/events/${segment}`} className="text-sm text-primary hover:underline">
              Back to event details
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              Participants
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{event?.title || "Event"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#1e2d42] dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={removeBulk}
              disabled={selected.length === 0}
              className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              Remove Selected ({selected.length})
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <input
            id="participants-search"
            name="participants-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, UTR"
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
          />
          <select
            id="participants-status"
            name="participants-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="revoked">Revoked</option>
          </select>
          <button
            type="button"
            onClick={fetchRows}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white dark:bg-primary"
          >
            Search
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-[#1e2d42] dark:bg-[#161f2e]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-[#161f2e]/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">
                  <input
                    id="select-all-participants"
                    name="select-all-participants"
                    type="checkbox"
                    checked={filteredRows.length > 0 && selected.length === filteredRows.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3">S.No</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Members</th>
                {isPaid && <th className="px-4 py-3">UTR</th>}
                {isPaid && <th className="px-4 py-3">Paid</th>}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isPaid ? 11 : 9} className="px-4 py-6 text-center text-slate-500">
                    Loading participants...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={isPaid ? 11 : 9} className="px-4 py-6 text-center text-slate-500">
                    No participants found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row._id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">
                      <input
                        id={`participant-${row._id}`}
                        name={`participant-${row._id}`}
                        type="checkbox"
                        checked={selected.includes(row._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelected((prev) => [...prev, row._id]);
                          else setSelected((prev) => prev.filter((x) => x !== row._id));
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {row?.user?.name || "—"}
                    </td>
                    <td className="px-4 py-3">{row?.user?.email || "—"}</td>
                    <td className="px-4 py-3 capitalize">{row.registrationType || "solo"}</td>
                    <td className="px-4 py-3">{row.teamName || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {(() => {
                        const tm = row.teammates || [];
                        const ok = tm.filter((t) => t.status === "confirmed").length;
                        return tm.length ? `${ok}/${tm.length} confirmed` : "—";
                      })()}
                    </td>
                    {isPaid && (
                      <td className="px-4 py-3">
                        {row?.utrNumber ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {row.utrNumber}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                    {isPaid && (
                      <td className="px-4 py-3">
                        {Number(row.amountPaid || 0) > 0
                          ? `₹${row.amountPaid}`
                          : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">{row.status || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeOne(row._id)}
                        className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
