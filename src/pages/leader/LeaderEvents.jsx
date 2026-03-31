import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, CheckCircle2, Clock3, Pencil, Plus, Search, XCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useLeaderEvents, { createLeaderEvent, updateLeaderEvent } from "../../hooks/useLeaderEvents";
import { uploadEventImage, uploadEventQr } from "../../hooks/useAdminEvents";
import { canCreateClubEvent, canEditEvent, getApprovalMeta, isEventApproved } from "../../utils/eventApproval";

const emptyForm = {
  title: "",
  description: "",
  imageUrl: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  registrationStart: "",
  registrationEnd: "",
  location: "",
  totalSeats: "",
  availableSeats: "",
  registrationTypes: ["solo"],
  fees: { solo: 0, duo: 0, squad: 0 },
  isFree: { solo: true, duo: true, squad: true },
  teamSize: { min: 2, max: 5 },
  upiId: "",
  upiQrImageUrl: "",
  status: "upcoming",
  isRecommended: false,
  isWorkshop: false,
};

function EventFormModal({ title, initialValues, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    ...emptyForm,
    ...initialValues,
    eventDate: initialValues?.eventDate || "",
    startTime: initialValues?.startTime || "",
    endTime: initialValues?.endTime || "",
    registrationStart: initialValues?.registrationStart || "",
    registrationEnd: initialValues?.registrationEnd || "",
  });
  const [error, setError] = useState("");

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleUpload = async (event, field, uploader) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await uploader(file);
    if (result?.url) {
      set(field, result.url);
      return;
    }
    setError(result?.error || "Upload failed.");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Event title is required.");
    if (!form.eventDate || !form.registrationStart || !form.registrationEnd) {
      return setError("Event date and registration window are required.");
    }
    setError("");
    await onSubmit(form, setError);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1e2d42] dark:bg-[#161f2e]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            Close
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Event title" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#0f172a]" />
            <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Location" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#0f172a]" />
            <input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#0f172a]" />
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#0f172a]">
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#0f172a]" />
            <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#0f172a]" />
            <input type="datetime-local" value={form.registrationStart} onChange={(e) => set("registrationStart", e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#0f172a]" />
            <input type="datetime-local" value={form.registrationEnd} onChange={(e) => set("registrationEnd", e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#0f172a]" />
            <input type="number" min="0" value={form.totalSeats} onChange={(e) => set("totalSeats", e.target.value)} placeholder="Total seats" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#0f172a]" />
            <input type="number" min="0" value={form.availableSeats} onChange={(e) => set("availableSeats", e.target.value)} placeholder="Available seats" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#0f172a]" />
          </div>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Description" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#0f172a]" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm dark:border-[#1e2d42]">
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Event image</span>
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "imageUrl", uploadEventImage)} className="mt-2 block w-full text-xs" />
            </label>
            <label className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm dark:border-[#1e2d42]">
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">UPI QR image</span>
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "upiQrImageUrl", uploadEventQr)} className="mt-2 block w-full text-xs" />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#1e2d42]">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? "Saving..." : "Save Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeaderEvents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { items, loading, error, refetch, stats } = useLeaderEvents({ search, approvalStatus: approvalFilter });

  const canCreate = canCreateClubEvent(user);
  const visibleEvents = useMemo(() => items, [items]);

  const handleCreate = async (values, setError) => {
    setSubmitting(true);
    const res = await createLeaderEvent(values);
    setSubmitting(false);
    if (res?.success) {
      setCreateOpen(false);
      refetch();
      return;
    }
    setError(res?.message || "Failed to create event.");
  };

  const handleEdit = async (values, setError) => {
    if (!editTarget?._id) return;
    setSubmitting(true);
    const res = await updateLeaderEvent(editTarget._id, values);
    setSubmitting(false);
    if (res?.success) {
      setEditTarget(null);
      refetch();
      return;
    }
    setError(res?.message || "Failed to update event.");
  };

  const handleViewCertificates = (eventId) => {
    if (!eventId) return;
    navigate(`/leader/certificates?eventId=${encodeURIComponent(eventId)}`);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {createOpen && (
        <EventFormModal title="Create Club Event" initialValues={emptyForm} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} submitting={submitting} />
      )}
      {editTarget && (
        <EventFormModal title="Edit Club Event" initialValues={editTarget} onClose={() => setEditTarget(null)} onSubmit={handleEdit} submitting={submitting} />
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Club Events</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Faculty coordinators submit events for approval. Approved events unlock attendance and certificates.
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">
            <Plus className="h-4 w-4" />
            New Club Event
          </button>
        )}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1e2d42] dark:bg-[#161f2e]"><div className="text-xs text-slate-500">Total</div><div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1e2d42] dark:bg-[#161f2e]"><div className="text-xs text-slate-500">Pending Approval</div><div className="mt-1 text-2xl font-bold text-amber-600">{stats.pendingApproval}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1e2d42] dark:bg-[#161f2e]"><div className="text-xs text-slate-500">Approved Upcoming</div><div className="mt-1 text-2xl font-bold text-blue-600">{stats.upcoming}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1e2d42] dark:bg-[#161f2e]"><div className="text-xs text-slate-500">Rejected</div><div className="mt-1 text-2xl font-bold text-rose-600">{stats.rejected}</div></div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search club events..." className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e]" />
        </div>
        <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
          <option value="">All approval states</option>
          <option value="pending_approval">Pending approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1e2d42] dark:bg-[#161f2e]">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Loading club events...</div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-rose-600 dark:text-rose-400">{error}</div>
        ) : visibleEvents.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No club events found yet.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleEvents.map((event) => {
              const approval = getApprovalMeta(event);
              const approved = isEventApproved(event);
              const canEdit = canEditEvent(event, user);
              return (
                <div key={event._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1e2d42] dark:bg-[#0f172a]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-900 dark:text-white">{event.title}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${approval.className}`}>{approval.label}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-[#161f2e] dark:text-slate-300">{event.status || "upcoming"}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{event.eventDate || "Date TBA"}</span>
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{event.startTime || "Time TBA"}</span>
                        {approved ? <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Live for attendance/certificates</span> : <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><XCircle className="h-3.5 w-3.5" />Waiting for admin approval</span>}
                      </div>
                      {event.description && (
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{event.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canEdit && (
                        <button type="button" onClick={() => setEditTarget(event)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-200">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      )}
                      <button type="button" disabled={!approved} onClick={() => handleViewCertificates(event._id)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-200">
                        Certificates
                      </button>
                      <Link to="/leader/attendance" className={`rounded-xl border px-3 py-2 text-xs font-semibold ${approved ? "border-slate-200 bg-white text-slate-700 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-200" : "pointer-events-none border-slate-200 bg-white text-slate-400 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-500"}`}>
                        Attendance
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
