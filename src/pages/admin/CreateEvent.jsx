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
import { createAdminEvent, uploadEventImage, uploadEventQr } from "../../hooks/useAdminEvents";
import { resolveEventImageUrl } from "../../utils/eventUrls";

const EMPTY_FORM = {
  title: "",
  description: "",
  imageUrl: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  registrationStart: "",
  registrationEnd: "",
  registrationTypes: ["solo"],
  fees: { solo: "", duo: "", squad: "" },
  isFree: { solo: true, duo: true, squad: true },
  teamSize: { min: "2", max: "5" },
  upiId: "",
  upiQrImageUrl: "",
  location: "",
  totalSeats: "",
  availableSeats: "",
  isRecommended: false,
  isWorkshop: false,
};

function eventFormNeedsUpi(f) {
  const types = f.registrationTypes?.length ? f.registrationTypes : ["solo"];
  return types.some((t) => !f.isFree?.[t] && Number(f.fees?.[t] || 0) > 0);
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e] overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-[#1e2d42] px-6 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white dark:placeholder:text-slate-500";

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
  const [qrPreview, setQrPreview] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const fileInputRef = useRef(null);
  const qrInputRef = useRef(null);
  const registrationWindowRef = useRef(null);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  };
  const resolvePreviewSrc = (value) =>
    value && (value.startsWith("blob:") || value.startsWith("data:"))
      ? value
      : resolveEventImageUrl(value);

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
    const types = form.registrationTypes?.length ? form.registrationTypes : [];
    if (types.length === 0) errs.registrationTypes = "Select at least one registration type.";
    for (const t of types) {
      const fee = Number(form.fees?.[t] ?? "");
      if (!form.isFree?.[t]) {
        if (!Number.isFinite(fee) || fee <= 0) {
          errs[`fees.${t}`] = "Enter a fee greater than 0 for paid types.";
        }
      } else if (form.fees?.[t] !== "" && (!Number.isFinite(fee) || fee < 0)) {
        errs[`fees.${t}`] = "Fee must be 0 or positive.";
      }
    }
    if (types.includes("squad")) {
      const smin = Number(form.teamSize?.min);
      const smax = Number(form.teamSize?.max);
      if (!Number.isFinite(smin) || smin < 2 || smin > 10) errs.teamSizeMin = "Min team size 2–10.";
      if (!Number.isFinite(smax) || smax < 2 || smax > 10) errs.teamSizeMax = "Max team size 2–10.";
      if (Number.isFinite(smin) && Number.isFinite(smax) && smax < smin) {
        errs.teamSizeMax = "Max must be ≥ min.";
      }
    }
    if (eventFormNeedsUpi(form)) {
      if (!form.upiId.trim()) errs.upiId = "UPI ID is required when any type is paid.";
      if (!form.upiQrImageUrl) errs.upiQrImageUrl = "UPI QR image is required when any type is paid.";
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
      if (errors.upiQrImageUrl) {
        setErrors((e) => {
          const next = { ...e };
          delete next.upiQrImageUrl;
          return next;
        });
      }
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
      registrationTypes: form.registrationTypes?.length ? form.registrationTypes : ["solo"],
      fees: {
        solo: form.fees?.solo === "" ? 0 : Number(form.fees?.solo),
        duo: form.fees?.duo === "" ? 0 : Number(form.fees?.duo),
        squad: form.fees?.squad === "" ? 0 : Number(form.fees?.squad),
      },
      isFree: { ...form.isFree },
      teamSize: {
        min: Number(form.teamSize?.min) || 2,
        max: Number(form.teamSize?.max) || 5,
      },
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
            <label htmlFor="create-event-banner-file" className="sr-only">
              Event banner image
            </label>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="relative w-full sm:w-64 h-36 rounded-2xl overflow-hidden border border-dashed border-slate-300 dark:border-[#1e2d42] bg-slate-50 dark:bg-[#161f2e]">
                {imagePreview || form.imageUrl ? (
                  <img
                    src={resolvePreviewSrc(imagePreview || form.imageUrl)}
                    alt="Event banner preview"
                    className="w-full h-full object-contain object-center"
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
              id="create-event-banner-file"
              name="create-event-banner-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerFileChange}
            />
          </SectionCard>

          {/* Registration types & pricing */}
          <SectionCard icon={Users} title="Registration types">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Enable one or more types. Each can be free or paid. UPI and QR are shared for all paid types.
            </p>
            {errors.registrationTypes && (
              <p className="mb-2 text-xs text-rose-500">{errors.registrationTypes}</p>
            )}
            {(["solo", "duo", "squad"]).map((type) => {
              const label = type === "solo" ? "Solo" : type === "duo" ? "Duo (2 people)" : "Squad";
              const enabled = form.registrationTypes?.includes(type);
              return (
                <div
                  key={type}
                  className="mb-4 rounded-xl border border-slate-200 dark:border-[#1e2d42] p-4 space-y-3"
                >
                  <label className="flex items-center gap-2">
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
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
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
                          className="h-4 w-4 rounded border-slate-300 text-primary"
                        />
                        Free (no fee)
                      </label>
                      {!form.isFree?.[type] && (
                        <Field label={`${label} fee (INR)`} htmlFor={`fee-${type}`}>
                          <input
                            id={`fee-${type}`}
                            type="number"
                            min="0"
                            step="1"
                            value={form.fees?.[type] ?? ""}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                fees: { ...f.fees, [type]: e.target.value },
                              }))
                            }
                            className={`${inputCls} ${errors[`fees.${type}`] ? "border-rose-400" : ""}`}
                          />
                          {errors[`fees.${type}`] && (
                            <p className="mt-1 text-xs text-rose-500">{errors[`fees.${type}`]}</p>
                          )}
                        </Field>
                      )}
                      {type === "squad" && (
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Min team size" htmlFor="squad-min">
                            <input
                              id="squad-min"
                              type="number"
                              min="2"
                              max="10"
                              value={form.teamSize?.min ?? ""}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  teamSize: { ...f.teamSize, min: e.target.value },
                                }))
                              }
                              className={`${inputCls} ${errors.teamSizeMin ? "border-rose-400" : ""}`}
                            />
                            {errors.teamSizeMin && (
                              <p className="mt-1 text-xs text-rose-500">{errors.teamSizeMin}</p>
                            )}
                          </Field>
                          <Field label="Max team size" htmlFor="squad-max">
                            <input
                              id="squad-max"
                              type="number"
                              min="2"
                              max="10"
                              value={form.teamSize?.max ?? ""}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  teamSize: { ...f.teamSize, max: e.target.value },
                                }))
                              }
                              className={`${inputCls} ${errors.teamSizeMax ? "border-rose-400" : ""}`}
                            />
                            {errors.teamSizeMax && (
                              <p className="mt-1 text-xs text-rose-500">{errors.teamSizeMax}</p>
                            )}
                          </Field>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {eventFormNeedsUpi(form) && (
              <div className="space-y-4 mt-4 border-t border-slate-200 dark:border-[#1e2d42] pt-4">
                <Field label="UPI ID" required htmlFor="create-event-upi-id">
                  <input
                    id="create-event-upi-id"
                    name="create-event-upi-id"
                    type="text"
                    value={form.upiId}
                    onChange={(e) => set("upiId", e.target.value)}
                    placeholder="example@upi"
                    className={`${inputCls} ${errors.upiId ? "border-rose-400 focus:border-rose-400 focus:ring-rose-200" : ""}`}
                  />
                  {errors.upiId && <p className="mt-1 text-xs text-rose-500">{errors.upiId}</p>}
                </Field>

                <div>
                  <label htmlFor="create-event-upi-qr-file" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    UPI QR Image <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="relative w-full sm:w-44 h-32 rounded-2xl overflow-hidden border border-dashed border-slate-300 dark:border-[#1e2d42] bg-slate-50 dark:bg-[#161f2e]">
                      {qrPreview || form.upiQrImageUrl ? (
                        <img
                          src={resolvePreviewSrc(qrPreview || form.upiQrImageUrl)}
                          alt="UPI QR preview"
                          className="w-full h-full object-contain object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-500 dark:text-slate-400 px-2 text-center">
                          Upload UPI QR image
                        </div>
                      )}
                      {qrUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => qrInputRef.current?.click()}
                        disabled={qrUploading || submitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-primary px-4 py-2 text-xs font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-primary/90 disabled:opacity-60"
                      >
                        {qrUploading ? "Uploading…" : form.upiQrImageUrl ? "Change QR" : "Choose QR"}
                      </button>
                      {qrFile && !qrError && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                          {qrFile.name}
                        </p>
                      )}
                      {qrError && <p className="text-xs text-rose-500">{qrError}</p>}
                      {errors.upiQrImageUrl && <p className="text-xs text-rose-500">{errors.upiQrImageUrl}</p>}
                    </div>
                  </div>
                  <input
                    ref={qrInputRef}
                    id="create-event-upi-qr-file"
                    name="create-event-upi-qr-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQrFileChange}
                  />
                </div>
              </div>
            )}
          </SectionCard>

          {/* Basic Info */}
          <SectionCard icon={FileText} title="Basic Information">
            <Field label="Event Title" required htmlFor="create-event-title">
              <input
                id="create-event-title"
                name="create-event-title"
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

            <Field label="Description" htmlFor="create-event-description">
              <textarea
                id="create-event-description"
                name="create-event-description"
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Give attendees a clear overview of the event…"
                className={`${inputCls} resize-none`}
              />
            </Field>

          </SectionCard>

          {/* Dashboard Sections */}
          <SectionCard icon={Calendar} title="Dashboard Sections">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control where this event appears on the Student Dashboard tabs.
            </p>
            <div className="space-y-3">
              <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-[#1e2d42] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Show in Recommended
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Event appears in the Recommended tab.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isRecommended}
                  onChange={(e) => set("isRecommended", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-[#1e2d42] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Show in Workshops
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Event appears in the Workshops tab.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isWorkshop}
                  onChange={(e) => set("isWorkshop", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
              </label>
            </div>
          </SectionCard>

          {/* Schedule */}
          <SectionCard icon={Clock} title="Schedule">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Set when the event starts and ends. This should usually be after the registration
              window.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Event Starts" required htmlFor="create-event-starts">
                <input
                  id="create-event-starts"
                  name="create-event-starts"
                  type="datetime-local"
                  value={
                    form.eventDate
                      ? `${form.eventDate}T${(form.startTime || "00:00").slice(0, 5)}`
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      set("eventDate", "");
                      set("startTime", "");
                      return;
                    }
                    const [date, timeWithSeconds] = value.split("T");
                    const time = (timeWithSeconds || "").slice(0, 5);
                    set("eventDate", date || "");
                    set("startTime", time);
                  }}
                  className={`${inputCls} ${errors.eventDate ? "border-rose-400" : ""}`}
                />
                {errors.eventDate && (
                  <p className="mt-1 text-xs text-rose-500">{errors.eventDate}</p>
                )}
              </Field>
              <Field label="Event Ends" htmlFor="create-event-ends">
                <input
                  id="create-event-ends"
                  name="create-event-ends"
                  type="datetime-local"
                  value={
                    form.eventDate && form.endTime
                      ? `${form.eventDate}T${(form.endTime || "00:00").slice(0, 5)}`
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      set("endTime", "");
                      return;
                    }
                    const [, timeWithSeconds] = value.split("T");
                    const time = (timeWithSeconds || "").slice(0, 5);
                    set("endTime", time);
                  }}
                  className={`${inputCls} ${errors.endTime ? "border-rose-400" : ""}`}
                />
                {errors.endTime && (
                  <p className="mt-1 text-xs text-rose-500">{errors.endTime}</p>
                )}
              </Field>
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
              <Field label="Registration Opens" required htmlFor="create-event-registration-start">
                <input
                  id="create-event-registration-start"
                  name="create-event-registration-start"
                  type="datetime-local"
                  value={form.registrationStart}
                  onChange={(e) => set("registrationStart", e.target.value)}
                  className={`${inputCls} ${errors.registrationStart ? "border-rose-400" : ""}`}
                />
                {errors.registrationStart && (
                  <p className="mt-1 text-xs text-rose-500">{errors.registrationStart}</p>
                )}
              </Field>
              <Field label="Registration Closes" required htmlFor="create-event-registration-end">
                <input
                  id="create-event-registration-end"
                  name="create-event-registration-end"
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
            <Field label="Location / Venue" htmlFor="create-event-location">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="create-event-location"
                  name="create-event-location"
                  type="text"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Main Auditorium, Block A"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Total Seats" htmlFor="create-event-total-seats">
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="create-event-total-seats"
                    name="create-event-total-seats"
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
              <Field label="Available Seats" htmlFor="create-event-available-seats">
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="create-event-available-seats"
                    name="create-event-available-seats"
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
        <div className="mt-7 flex items-center justify-between border-t border-slate-200 dark:border-[#1e2d42] pt-6">
          <Link
            to="/admin/events"
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60 transition-colors dark:bg-primary dark:hover:bg-primary/90"
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
