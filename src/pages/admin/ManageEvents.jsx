import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // useNavigate used for state clear
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Search,
  Pencil,
  Trash2,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  Ban,
  RefreshCcw,
  Image,
} from "lucide-react";
import useAdminEvents, {
  deleteAdminEvent,
  updateAdminEvent,
  uploadEventImage,
  uploadEventQr,
} from "../../hooks/useAdminEvents";
import { resolveEventImageUrl } from "../../utils/eventUrls";
import { eventRouteSegment } from "../../utils/eventRoutes";

const STATUS_OPTS = ["All", "upcoming", "ongoing", "completed", "cancelled"];

const STATUS_META = {
  upcoming: {
    label: "Upcoming",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    dot: "bg-blue-500",
    icon: Clock,
  },
  ongoing: {
    label: "Ongoing",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  completed: {
    label: "Completed",
    cls: "bg-slate-100 text-slate-600 dark:bg-[#161f2e] dark:text-slate-300",
    dot: "bg-slate-400",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    dot: "bg-rose-500",
    icon: Ban,
  },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.upcoming;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function StatChip({ label, value, accent }) {
  const accents = {
    default: "bg-slate-100 text-slate-700 dark:bg-[#161f2e] dark:text-slate-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
    slate: "bg-slate-100 text-slate-500 dark:bg-[#161f2e] dark:text-slate-400",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300",
  };
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${accents[accent || "default"]}`}>
      <span className="text-xl font-black leading-none">{value}</span>
      <span className="text-xs font-semibold leading-tight">{label}</span>
    </div>
  );
}

function editModalNeedsUpi(form) {
  const types = form.registrationTypes?.length ? form.registrationTypes : ["solo"];
  return types.some((t) => !form.isFree?.[t] && Number(form.fees?.[t] || 0) > 0);
}

function EditEventModal({ event, onClose, onSaved }) {
  const formatDateTimeLocal = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return adjusted.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    title: event.title || "",
    description: event.description || "",
    eventDate: event.eventDate ? event.eventDate.slice(0, 10) : "",
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    location: event.location || "",
    totalSeats: event.totalSeats ?? 0,
    availableSeats: event.availableSeats ?? 0,
    imageUrl: event.imageUrl || "",
    registrationStart: formatDateTimeLocal(event.registrationStart),
    registrationEnd: formatDateTimeLocal(event.registrationEnd),
    registrationTypes: event.registrationTypes?.length ? event.registrationTypes : ["solo"],
    fees: {
      solo: event.fees?.solo ?? 0,
      duo: event.fees?.duo ?? 0,
      squad: event.fees?.squad ?? 0,
    },
    isFree: {
      solo: event.isFree?.solo !== false,
      duo: event.isFree?.duo !== false,
      squad: event.isFree?.squad !== false,
    },
    teamSize: {
      min: event.teamSize?.min ?? 2,
      max: event.teamSize?.max ?? 5,
    },
    upiId: event.upiId || "",
    upiQrImageUrl: event.upiQrImageUrl || "",
    isRecommended: !!event.isRecommended,
    isWorkshop: !!event.isWorkshop,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const fileInputRef = useRef(null);
  const qrInputRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const resolvePreviewSrc = (value) =>
    value && (value.startsWith("blob:") || value.startsWith("data:"))
      ? value
      : resolveEventImageUrl(value);

  const handleBannerFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("File is too large. Maximum size is 5 MB.");
      return;
    }

    setImageError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    setImageUploading(true);
    const result = await uploadEventImage(file);
    setImageUploading(false);

    if (result?.error) {
      setImageError(result.error);
      setImageFile(null);
      setImagePreview(null);
      set("imageUrl", "");
    } else if (result?.url) {
      set("imageUrl", result.url);
    }
  };

  const handleQrFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setQrError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setQrError("File is too large. Maximum size is 5 MB.");
      return;
    }

    setQrError(null);
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));

    setQrUploading(true);
    const result = await uploadEventQr(file);
    setQrUploading(false);

    if (result?.error) {
      setQrError(result.error);
      setQrFile(null);
      setQrPreview(null);
      set("upiQrImageUrl", "");
    } else if (result?.url) {
      set("upiQrImageUrl", result.url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErr("Event title is required."); return; }
    if (!form.eventDate) { setErr("Event date is required."); return; }
    if (!form.registrationStart || !form.registrationEnd) {
      setErr("Registration start and end are required.");
      return;
    }
    const regStart = new Date(form.registrationStart);
    const regEnd = new Date(form.registrationEnd);
    if (regStart >= regEnd) {
      setErr("Registration start must be before registration end.");
      return;
    }
    const eventStart = new Date(
      `${form.eventDate}T${(form.startTime || "00:00").slice(0, 5)}:00`
    );
    if (!Number.isNaN(eventStart.getTime()) && regEnd > eventStart) {
      setErr("Registration end cannot be after the event start time.");
      return;
    }
    const types = form.registrationTypes?.length ? form.registrationTypes : [];
    if (types.length === 0) {
      setErr("Select at least one registration type.");
      return;
    }
    for (const t of types) {
      const fee = Number(form.fees?.[t] ?? 0);
      if (!form.isFree?.[t] && (!Number.isFinite(fee) || fee <= 0)) {
        setErr(`Enter a fee greater than 0 for paid ${t} registration.`);
        return;
      }
    }
    if (types.includes("squad")) {
      const smin = Number(form.teamSize?.min);
      const smax = Number(form.teamSize?.max);
      if (!Number.isFinite(smin) || !Number.isFinite(smax) || smax < smin || smin < 2 || smax > 10) {
        setErr("Squad team size: min and max must be between 2 and 10, max ≥ min.");
        return;
      }
    }
    if (editModalNeedsUpi(form)) {
      if (!form.upiId.trim()) {
        setErr("UPI ID is required when any type is paid.");
        return;
      }
      if (!form.upiQrImageUrl) {
        setErr("UPI QR image is required when any type is paid.");
        return;
      }
    }
    setSaving(true);
    setErr(null);
    const res = await updateAdminEvent(event._id, {
      ...form,
      totalSeats: form.totalSeats === "" ? 0 : Number(form.totalSeats),
      availableSeats:
        form.availableSeats === "" ? undefined : Number(form.availableSeats),
      registrationTypes: types,
      fees: {
        solo: Number(form.fees?.solo) || 0,
        duo: Number(form.fees?.duo) || 0,
        squad: Number(form.fees?.squad) || 0,
      },
      isFree: { ...form.isFree },
      teamSize: {
        min: Number(form.teamSize?.min) || 2,
        max: Number(form.teamSize?.max) || 5,
      },
    });
    setSaving(false);
    if (res?.success) {
      onSaved("Event updated successfully.");
    } else {
      setErr(res?.message || "Update failed. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1e2d42] dark:bg-[#161f2e] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2d42] px-5 py-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Event</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {err && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {err}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor={`edit-event-${event._id}-banner-file`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Event Banner
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative w-full sm:w-56 h-32 rounded-xl overflow-hidden border border-dashed border-slate-300 dark:border-[#1e2d42] bg-slate-50 dark:bg-[#161f2e]">
                {imagePreview || form.imageUrl ? (
                  <img
                    src={resolvePreviewSrc(imagePreview || form.imageUrl)}
                    alt="Event banner preview"
                    className="w-full h-full object-contain object-center"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center px-3">
                    <Image className="h-5 w-5 text-slate-400" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload event banner image
                    </p>
                  </div>
                )}
                {imageUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading || saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-primary px-3.5 py-2 text-xs font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-primary/90 disabled:opacity-60"
                >
                  {imageUploading ? "Uploading..." : form.imageUrl ? "Change image" : "Choose image"}
                </button>
                {imageFile && !imageError && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[170px]">
                    {imageFile.name}
                  </p>
                )}
                {imageError && <p className="text-xs text-rose-500">{imageError}</p>}
              </div>
            </div>
            <input
              ref={fileInputRef}
              id={`edit-event-${event._id}-banner-file`}
              name={`edit-event-${event._id}-banner-file`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerFileChange}
            />
          </div>

          <div>
            <label htmlFor={`edit-event-${event._id}-title`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Title *
            </label>
            <input
              id={`edit-event-${event._id}-title`}
              name={`edit-event-${event._id}-title`}
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              placeholder="Event title"
            />
          </div>

          <div>
            <label htmlFor={`edit-event-${event._id}-description`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              id={`edit-event-${event._id}-description`}
              name={`edit-event-${event._id}-description`}
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              placeholder="Short description…"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label htmlFor={`edit-event-${event._id}-date`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Date *
              </label>
              <input
                id={`edit-event-${event._id}-date`}
                name={`edit-event-${event._id}-date`}
                type="date"
                value={form.eventDate}
                onChange={(e) => set("eventDate", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`edit-event-${event._id}-start-time`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Start Time
              </label>
              <input
                id={`edit-event-${event._id}-start-time`}
                name={`edit-event-${event._id}-start-time`}
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              />
            </div>
            <div>
              <label htmlFor={`edit-event-${event._id}-end-time`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                End Time
              </label>
              <input
                id={`edit-event-${event._id}-end-time`}
                name={`edit-event-${event._id}-end-time`}
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label htmlFor={`edit-event-${event._id}-registration-start`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Registration Opens *
              </label>
              <input
                id={`edit-event-${event._id}-registration-start`}
                name={`edit-event-${event._id}-registration-start`}
                type="datetime-local"
                value={form.registrationStart}
                onChange={(e) => set("registrationStart", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              />
            </div>
            <div>
              <label htmlFor={`edit-event-${event._id}-registration-end`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Registration Closes *
              </label>
              <input
                id={`edit-event-${event._id}-registration-end`}
                name={`edit-event-${event._id}-registration-end`}
                type="datetime-local"
                value={form.registrationEnd}
                onChange={(e) => set("registrationEnd", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`edit-event-${event._id}-location`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Location
            </label>
            <input
              id={`edit-event-${event._id}-location`}
              name={`edit-event-${event._id}-location`}
              type="text"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              placeholder="Venue or room name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`edit-event-${event._id}-total-seats`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Total Seats
              </label>
              <input
                id={`edit-event-${event._id}-total-seats`}
                name={`edit-event-${event._id}-total-seats`}
                type="number"
                min="0"
                value={form.totalSeats}
                onChange={(e) => set("totalSeats", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              />
            </div>
            <div>
              <label htmlFor={`edit-event-${event._id}-available-seats`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Available Seats
              </label>
              <input
                id={`edit-event-${event._id}-available-seats`}
                name={`edit-event-${event._id}-available-seats`}
                type="number"
                min="0"
                value={form.availableSeats}
                onChange={(e) => set("availableSeats", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Registration types
            </label>
            {(["solo", "duo", "squad"]).map((type) => {
              const label = type === "solo" ? "Solo" : type === "duo" ? "Duo" : "Squad";
              const enabled = form.registrationTypes?.includes(type);
              return (
                <div key={type} className="rounded-lg border border-slate-200 dark:border-[#1e2d42] p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => {
                        setForm((f) => {
                          const set = new Set(f.registrationTypes || []);
                          if (set.has(type)) set.delete(type);
                          else set.add(type);
                          let next = [...set];
                          if (next.length === 0) next = ["solo"];
                          return { ...f, registrationTypes: next };
                        });
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-primary"
                    />
                    {label}
                  </label>
                  {enabled && (
                    <>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={!!form.isFree?.[type]}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              isFree: { ...f.isFree, [type]: e.target.checked },
                            }))
                          }
                          className="h-4 w-4"
                        />
                        Free
                      </label>
                      {!form.isFree?.[type] && (
                        <input
                          type="number"
                          min="0"
                          value={form.fees?.[type] ?? ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              fees: { ...f.fees, [type]: e.target.value === "" ? "" : Number(e.target.value) },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
                          placeholder="Fee INR"
                        />
                      )}
                      {type === "squad" && (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min="2"
                            max="10"
                            value={form.teamSize?.min ?? ""}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                teamSize: { ...f.teamSize, min: e.target.value === "" ? "" : Number(e.target.value) },
                              }))
                            }
                            className="rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e]"
                            placeholder="Min"
                          />
                          <input
                            type="number"
                            min="2"
                            max="10"
                            value={form.teamSize?.max ?? ""}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                teamSize: { ...f.teamSize, max: e.target.value === "" ? "" : Number(e.target.value) },
                              }))
                            }
                            className="rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e]"
                            placeholder="Max"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {editModalNeedsUpi(form) && (
              <>
                <div>
                  <label htmlFor={`edit-event-${event._id}-upi-id`} className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    UPI ID *
                  </label>
                  <input
                    id={`edit-event-${event._id}-upi-id`}
                    name={`edit-event-${event._id}-upi-id`}
                    type="text"
                    value={form.upiId}
                    onChange={(e) => set("upiId", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
                    placeholder="example@upi"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor={`edit-event-${event._id}-upi-qr-file`} className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    UPI QR Image *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="relative w-full sm:w-40 h-28 rounded-xl overflow-hidden border border-dashed border-slate-300 dark:border-[#1e2d42] bg-slate-50 dark:bg-[#161f2e]">
                      {qrPreview || form.upiQrImageUrl ? (
                        <img
                          src={resolvePreviewSrc(qrPreview || form.upiQrImageUrl)}
                          alt="UPI QR preview"
                          className="w-full h-full object-contain object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-500 dark:text-slate-400">
                          Upload QR
                        </div>
                      )}
                      {qrUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => qrInputRef.current?.click()}
                        disabled={qrUploading || saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-primary px-3.5 py-2 text-xs font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-primary/90 disabled:opacity-60"
                      >
                        {qrUploading
                          ? "Uploading..."
                          : form.upiQrImageUrl
                          ? "Change QR"
                          : "Choose QR"}
                      </button>
                      {qrFile && !qrError && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[170px]">
                          {qrFile.name}
                        </p>
                      )}
                      {qrError && <p className="text-xs text-rose-500">{qrError}</p>}
                    </div>
                  </div>
                  <input
                    ref={qrInputRef}
                    id={`edit-event-${event._id}-upi-qr-file`}
                    name={`edit-event-${event._id}-upi-qr-file`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQrFileChange}
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Dashboard Sections
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-[#1e2d42] px-3 py-2.5">
                <span className="text-sm text-slate-700 dark:text-slate-200">Show in Recommended</span>
                <input
                  type="checkbox"
                  checked={form.isRecommended}
                  onChange={(e) => set("isRecommended", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-[#1e2d42] px-3 py-2.5">
                <span className="text-sm text-slate-700 dark:text-slate-200">Show in Workshops</span>
                <input
                  type="checkbox"
                  checked={form.isWorkshop}
                  onChange={(e) => set("isWorkshop", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
              </label>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-[#1e2d42] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#1e2d42] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-primary dark:hover:bg-primary/90"
          >
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ event, onClose, onConfirm, deleting }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1e2d42] dark:bg-[#161f2e] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
          <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Delete Event?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{event.title}</span>{" "}
          will be permanently deleted along with all its registrations. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#1e2d42] hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {deleting && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ManageEvents() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Pick up success toast forwarded from CreateEvent
  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast);
      navigate(location.pathname, { replace: true, state: {} });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, loading, error, refetch } = useAdminEvents({
    search,
    status: statusFilter === "All" ? "" : statusFilter,
    page,
    limit: 10,
    sort: "eventDate_desc",
  });

  const { items, total, pages, stats } = data;

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteAdminEvent(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
    if (res?.success) {
      showToast("Event deleted.");
      refetch();
    } else {
      showToast(res?.message || "Delete failed.", false);
    }
  };

  const handleEditSaved = (msg) => {
    setEditTarget(null);
    showToast(msg);
    refetch();
  };

  return (
    <div className="admin-page-shell flex flex-1 flex-col min-w-0 overflow-x-hidden">
      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl transition-all ${
            toast.ok ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {editTarget && (
        <EditEventModal
          event={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleEditSaved}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          event={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Events</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create, manage, and track all campus events.
          </p>
        </div>
        <Link
          to="/admin/events/create"
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-colors bg-primary-600 hover:bg-primary-700 border-0 dark:bg-primary dark:hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Event
        </Link>
      </div>

      {/* Stat Chips */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-3 mb-6">
          <StatChip label="Total" value={stats.total} accent="default" />
          <StatChip label="Upcoming" value={stats.upcoming} accent="blue" />
          <StatChip label="Ongoing" value={stats.ongoing} accent="emerald" />
          <StatChip label="Completed" value={stats.completed} accent="slate" />
          {stats.cancelled > 0 && (
            <StatChip label="Cancelled" value={stats.cancelled} accent="rose" />
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="search-admin-events"
            name="search-admin-events"
            type="text"
            placeholder="Search by title or location…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                statusFilter === f
                  ? "btn-primary text-white shadow-sm dark:bg-primary"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#161f2e] dark:border-[#1e2d42] dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {f === "All" ? "All" : STATUS_META[f]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm">Loading events…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
            <AlertCircle className="h-7 w-7 text-rose-400" />
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-[#161f2e] dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 dark:text-slate-500">
            <Calendar className="h-10 w-10" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No events found</p>
            <p className="text-xs text-slate-400">
              {search || statusFilter !== "All"
                ? "Try adjusting your filters."
                : "Create the first event to get started."}
            </p>
            {!search && statusFilter === "All" && (
              <Link
                to="/admin/events/create"
                className="btn-primary mt-2 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 border-0 dark:bg-primary dark:hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                New Event
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-[#1e2d42] dark:bg-[#161f2e]/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Event</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Date</th>
                  <th className="px-5 py-3.5 hidden lg:table-cell">Location</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Registrations</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((event) => (
                  <tr
                    key={event._id}
                    className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    onClick={() => navigate(`/admin/events/${eventRouteSegment(event)}`)}
                  >
                    {/* Event title + club */}
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[220px]">
                            {event.title}
                          </p>
                          {event.clubId?.name && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {event.clubId.name}
                            </p>
                          )}
                          {/* Show date on mobile */}
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 md:hidden">
                            {formatDate(event.eventDate)}
                            {event.startTime && ` · ${event.startTime}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {formatDate(event.eventDate)}
                      </p>
                      {(event.startTime || event.endTime) && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}
                        </p>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {event.location ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate max-w-[140px]">{event.location}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Registrations */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium">{event.totalRegistrations ?? 0}</span>
                        {event.totalSeats > 0 && (
                          <span className="text-xs text-slate-400">/ {event.totalSeats}</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={event.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Certificates"
                          onClick={(e) => {
                            e.stopPropagation();
                            return (
                            navigate(`/admin/events/${eventRouteSegment(event)}/certificates`, {
                              state: { eventTitle: event.title },
                            })
                            );
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-200 dark:hover:border-blue-400"
                        >
                          🎓 Certificates
                        </button>
                        <button
                          type="button"
                          title="Edit event"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTarget(event);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors dark:hover:bg-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete event"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(event);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors dark:hover:bg-rose-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && pages > 1 && (
        <div className="mt-5 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <p>
            Page {page} of {pages} — {total} total event{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 dark:border-[#1e2d42] dark:hover:bg-slate-800"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 dark:border-[#1e2d42] dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
