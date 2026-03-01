import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  FileText,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Image,
} from "lucide-react";
import { createAdminEvent, uploadEventImage } from "../../hooks/useAdminEvents";

const EMPTY_FORM = {
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
  status: "upcoming",
};

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500";

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);
  const registrationWindowRef = useRef(null);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Event title is required.";
    if (!form.eventDate) errs.eventDate = "Event date is required.";
    if (form.endTime && form.startTime && form.endTime < form.startTime) {
      errs.endTime = "End time must be after start time.";
    }
     if (!form.registrationStart) {
       errs.registrationStart = "Registration start is required.";
     }
     if (!form.registrationEnd) {
       errs.registrationEnd = "Registration end is required.";
     }
     if (form.registrationStart && form.registrationEnd) {
       const start = new Date(form.registrationStart);
       const end = new Date(form.registrationEnd);
       if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
         if (start >= end) {
           errs.registrationStart = "Registration start must be before registration end.";
         }
       }
     }
     if (form.registrationEnd && form.eventDate) {
       const eventDate = new Date(form.eventDate);
       if (!Number.isNaN(eventDate.getTime())) {
         const [startHour = "00", startMin = "00"] = (form.startTime || "00:00").split(":");
         const eventStart = new Date(eventDate);
         eventStart.setHours(Number(startHour), Number(startMin), 0, 0);

         const regEnd = new Date(form.registrationEnd);
         if (!Number.isNaN(regEnd.getTime()) && regEnd > eventStart) {
           errs.registrationEnd = "Registration end cannot be after the event start time.";
         }
       }
     }
    const total = Number(form.totalSeats);
    const avail = Number(form.availableSeats);
    if (form.totalSeats !== "" && total < 0) errs.totalSeats = "Cannot be negative.";
    if (form.availableSeats !== "" && avail < 0) errs.availableSeats = "Cannot be negative.";
    if (form.availableSeats !== "" && form.totalSeats !== "" && avail > total) {
      errs.availableSeats = "Cannot exceed total seats.";
    }
    return errs;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.registrationStart || errs.registrationEnd) {
        setTimeout(() => registrationWindowRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
      }
      return;
    }
    setSubmitting(true);
    setApiError(null);
    const res = await createAdminEvent({
      ...form,
      totalSeats: form.totalSeats === "" ? 0 : Number(form.totalSeats),
      availableSeats: form.availableSeats === "" ? undefined : Number(form.availableSeats),
    });
    setSubmitting(false);
    if (res?.success) {
      navigate("/admin/events", { state: { toast: "Event created successfully." } });
    } else {
      const msg = res?.message || "Failed to create event. Please try again.";
      const displayMsg = msg.toLowerCase().includes("registration start and end")
        ? "Set the Registration Window below (Registration Opens and Registration Closes). " + msg
        : msg;
      setApiError(displayMsg);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto w-full">
      {/* Page Header */}
      <div className="mb-7">
        <Link
          to="/admin/events"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Events
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Create Event
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Fill in the details below to publish a new event.
        </p>
      </div>

      {/* API-level error */}
      {apiError && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          {/* Event Banner */}
          <SectionCard icon={Image} title="Event Banner">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="relative w-full sm:w-64 h-36 rounded-2xl overflow-hidden border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                {imagePreview || form.imageUrl ? (
                  <img
                    src={imagePreview || form.imageUrl}
                    alt="Event banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center px-4">
                    <Image className="h-7 w-7 text-slate-400" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Upload an image to use as the event banner.
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      JPG, PNG, or WebP up to 5 MB.
                    </p>
                  </div>
                )}
                {imageUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This image will appear on the student event card and details page.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading || submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-primary px-4 py-2 text-xs font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-primary/90 disabled:opacity-60"
                  >
                    {imageUploading ? "Uploading…" : form.imageUrl ? "Change image" : "Choose image"}
                  </button>
                  {imageFile && !imageError && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[160px]">
                      {imageFile.name}
                    </p>
                  )}
                </div>
                {imageError && (
                  <p className="text-xs text-rose-500">{imageError}</p>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerFileChange}
            />
          </SectionCard>

          {/* Basic Info */}
          <SectionCard icon={FileText} title="Basic Information">
            <Field label="Event Title" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Annual Tech Symposium 2025"
                className={`${inputCls} ${errors.title ? "border-rose-400 focus:border-rose-400 focus:ring-rose-200" : ""}`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-rose-500">{errors.title}</p>
              )}
            </Field>

            <Field label="Description">
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Give attendees a clear overview of the event…"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className={inputCls}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
            </div>
          </SectionCard>

          {/* Schedule */}
          <SectionCard icon={Clock} title="Schedule">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <Field label="Event Date" required>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => set("eventDate", e.target.value)}
                    className={`${inputCls} ${errors.eventDate ? "border-rose-400" : ""}`}
                  />
                  {errors.eventDate && (
                    <p className="mt-1 text-xs text-rose-500">{errors.eventDate}</p>
                  )}
                </Field>
              </div>
              <div>
                <Field label="Start Time">
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set("startTime", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <div>
                <Field label="End Time">
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set("endTime", e.target.value)}
                    className={`${inputCls} ${errors.endTime ? "border-rose-400" : ""}`}
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-xs text-rose-500">{errors.endTime}</p>
                  )}
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* Registration Window */}
          <div ref={registrationWindowRef}>
            <SectionCard icon={Clock} title="Registration Window">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Set when students can register for this event. Registration must close on or
              before the event start time.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Registration Opens" required>
                <input
                  type="datetime-local"
                  value={form.registrationStart}
                  onChange={(e) => set("registrationStart", e.target.value)}
                  className={`${inputCls} ${errors.registrationStart ? "border-rose-400" : ""}`}
                />
                {errors.registrationStart && (
                  <p className="mt-1 text-xs text-rose-500">{errors.registrationStart}</p>
                )}
              </Field>
              <Field label="Registration Closes" required>
                <input
                  type="datetime-local"
                  value={form.registrationEnd}
                  onChange={(e) => set("registrationEnd", e.target.value)}
                  className={`${inputCls} ${errors.registrationEnd ? "border-rose-400" : ""}`}
                />
                {errors.registrationEnd && (
                  <p className="mt-1 text-xs text-rose-500">{errors.registrationEnd}</p>
                )}
              </Field>
            </div>
          </SectionCard>
          </div>

          {/* Location & Capacity */}
          <SectionCard icon={MapPin} title="Venue & Capacity">
            <Field label="Location / Venue">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Main Auditorium, Block A"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Total Seats">
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    value={form.totalSeats}
                    onChange={(e) => set("totalSeats", e.target.value)}
                    placeholder="0 = unlimited"
                    className={`${inputCls} pl-9 ${errors.totalSeats ? "border-rose-400" : ""}`}
                  />
                </div>
                {errors.totalSeats && (
                  <p className="mt-1 text-xs text-rose-500">{errors.totalSeats}</p>
                )}
              </Field>
              <Field label="Available Seats">
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    value={form.availableSeats}
                    onChange={(e) => set("availableSeats", e.target.value)}
                    placeholder="Defaults to total seats"
                    className={`${inputCls} pl-9 ${errors.availableSeats ? "border-rose-400" : ""}`}
                  />
                </div>
                {errors.availableSeats && (
                  <p className="mt-1 text-xs text-rose-500">{errors.availableSeats}</p>
                )}
              </Field>
            </div>
          </SectionCard>
        </div>

        {/* Action Bar */}
        <div className="mt-7 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
          <Link
            to="/admin/events"
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Create Event
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
