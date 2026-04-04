import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Check,
  Paperclip,
  Link as LinkIcon,
  Loader2,
  Calendar,
  Users,
  CircleDot,
} from "lucide-react";
import api from "../../services/api";
import { resolveEventImageUrl } from "../../utils/eventUrls";
import confetti from "canvas-confetti";

const STEPS = ["Overview", "Your Application", "Review & Submit"];

const INPUT_STYLE =
  "w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-[0_0_0_3px] focus:ring-[rgba(59,130,246,0.1)]";
const INPUT_ERROR = "border-red-500 focus:border-red-500 focus:ring-red-500/20";

function formatDeadline(date) {
  if (!date) return "â€”";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fireConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#2563EB", "#3B82F6", "#22C55E", "#F59E0B"],
    });
  } catch (_) {}
}

export default function ApplyModal({ isOpen, onClose, drive, onSuccess }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [resumeUrl, setResumeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const questions = drive?.customQuestions || [];
  const clubName = drive?.clubId?.name || "Club";
  const logoUrl = drive?.clubId?.logoUrl;
  const initials = clubName.slice(0, 2).toUpperCase();
  const skills = drive?.requiredSkills || [];

  const setAnswer = useCallback((questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => ({ ...prev, [questionId]: null }));
  }, []);

  const validateStep2 = useCallback(() => {
    const nextErrors = {};
    questions.forEach((q) => {
      const id = q.questionId || q._id;
      if (q.required) {
        const val = answers[id];
        if (val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) {
          nextErrors[id] = "This field is required";
        }
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [questions, answers]);

  const validateStep3 = useCallback(() => {
    if (!confirmAccurate) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return false;
    }
    return true;
  }, [confirmAccurate]);

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const handleNext = () => {
    if (step === 2 && !validateStep2()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setSubmitting(true);
    setErrors({});
    try {
      const answersPayload = questions.map((q) => {
        const id = q.questionId || q._id;
        return { questionId: id, answer: answers[id] };
      });
      await api.post(`/api/drives/${drive._id}/apply`, {
        answers: answersPayload,
        resumeUrl: resumeUrl.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
      });
      setSuccess(true);
      fireConfetti();
      onSuccess?.();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (success) onSuccess?.();
    onClose();
    setStep(1);
    setAnswers({});
    setResumeUrl("");
    setPortfolioUrl("");
    setConfirmAccurate(false);
    setErrors({});
    setSuccess(false);
  };

  if (!isOpen) return null;

  const progressWidth = step === 1 ? "33%" : step === 2 ? "66%" : "100%";

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
        style={{ animation: "applyOverlayIn 150ms ease-out forwards" }}
        onClick={handleClose}
        aria-hidden
      />
      <div
        data-apply-modal
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-[0_25px_50px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]"
        style={{ animation: "applyModalSlide 300ms ease-out forwards" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-modal-title"
      >
        <style>{`
          @keyframes applyOverlayIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes applyModalSlide {
            from { opacity: 0; transform: translate(-50%, -50%) translateY(20px); }
            to { opacity: 1; transform: translate(-50%, -50%) translateY(0); }
          }
          @keyframes applyShake {
            0%,100% { transform: translateX(0); }
            20%,60% { transform: translateX(-6px); }
            40%,80% { transform: translateX(6px); }
          }
          @media (max-width: 767px) {
            [data-apply-modal] {
              top: 0; left: 0; right: 0; bottom: auto;
              max-height: 100vh;
              border-radius: 24px 24px 0 0;
              transform: none !important;
            }
          }
          @keyframes successCheckScale {
            0% { transform: scale(0); opacity: 0; }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

        <div className="shrink-0 px-6 pt-6 pb-0">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => {
              const stepNum = i + 1;
              const completed = step > stepNum;
              const active = step === stepNum;
              return (
                <React.Fragment key={stepNum}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        completed ? "bg-blue-600 text-white" : active ? "bg-blue-600 text-white ring-4 ring-blue-100" : "border-2 border-slate-200 bg-white text-slate-400"
                      } ${active ? "animate-pulse" : ""}`}
                    >
                      {completed ? <Check className="h-3.5 w-3.5" /> : stepNum}
                    </div>
                    <span className={`mt-1.5 text-xs font-medium ${active ? "text-blue-600" : "text-slate-400"}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className="mx-1 h-0.5 flex-1 rounded-full transition-all duration-400"
                      style={{
                        background: completed ? "#2563EB" : active ? "linear-gradient(90deg, #2563EB 50%, #E2E8F0 50%)" : "#E2E8F0",
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-400 ease-out"
              style={{ width: progressWidth }}
            />
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto px-6 py-6 ${shake ? "animate-[applyShake_0.4s_ease-in-out]" : ""}`}>
          {success ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green-100"
                style={{ animation: "successCheckScale 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
              >
                <Check className="h-9 w-9 text-green-600" strokeWidth={2.5} />
              </div>
              <h2 id="apply-modal-title" className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                Application Submitted! ðŸŽ‰
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                We&apos;ll notify you when the club reviews your application.
              </p>
              <Link
                to="/student/recruitment"
                onClick={handleClose}
                className="mt-6 text-sm font-medium text-blue-600 hover:underline"
              >
                View My Applications â†’
              </Link>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-lg font-bold text-slate-600">
                      {logoUrl ? (
                        <img src={resolveEventImageUrl(logoUrl)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">{clubName}</p>
                      <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{drive?.roleTitle}</h3>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" /> {formatDeadline(drive?.deadline)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                      <Users className="h-4 w-4" /> {drive?.applicantCount ?? 0} Applied
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                      <CircleDot className="h-4 w-4" /> {drive?.status === "open" ? "Open" : drive?.status}
                    </span>
                  </div>
                  <h4 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">About this Role</h4>
                  <p className="text-sm leading-relaxed text-slate-600">{drive?.description}</p>
                  {skills?.length > 0 && (
                    <>
                      <h4 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((s, i) => (
                          <span key={i} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 2 && (
                <div>
                  {questions.map((q) => {
                    const id = q.questionId || q._id;
                    const err = errors[id];
                    const value = answers[id];
                    const primaryFieldId =
                      q.type === "text"
                        ? `apply-q-text-${id}`
                        : q.type === "textarea"
                          ? `apply-q-textarea-${id}`
                          : q.type === "url"
                            ? `apply-q-url-${id}`
                            : null;
                    return (
                      <div key={id} className="mb-6">
                        {primaryFieldId ? (
                          <label htmlFor={primaryFieldId} className="mb-2 block text-sm font-semibold text-slate-800">
                            {q.label}
                            {q.required && <span className="ml-0.5 text-red-500">*</span>}
                          </label>
                        ) : (
                          <div className="mb-2 block text-sm font-semibold text-slate-800">
                            {q.label}
                            {q.required && <span className="ml-0.5 text-red-500">*</span>}
                          </div>
                        )}
                        {q.type === "text" && (
                          <input
                            id={`apply-q-text-${id}`}
                            name={`apply-q-text-${id}`}
                            type="text"
                            value={value ?? ""}
                            onChange={(e) => setAnswer(id, e.target.value)}
                            placeholder={q.placeholder}
                            className={`${INPUT_STYLE} ${err ? INPUT_ERROR : ""}`}
                          />
                        )}
                        {q.type === "textarea" && (
                          <textarea
                            id={`apply-q-textarea-${id}`}
                            name={`apply-q-textarea-${id}`}
                            value={value ?? ""}
                            onChange={(e) => setAnswer(id, e.target.value)}
                            placeholder={q.placeholder}
                            rows={4}
                            className={`resize-y ${INPUT_STYLE} ${err ? INPUT_ERROR : ""}`}
                          />
                        )}
                        {q.type === "url" && (
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              id={`apply-q-url-${id}`}
                              name={`apply-q-url-${id}`}
                              type="url"
                              value={value ?? ""}
                              onChange={(e) => setAnswer(id, e.target.value)}
                              placeholder={q.placeholder || "https://..."}
                              className={`pl-10 ${INPUT_STYLE} ${err ? INPUT_ERROR : ""}`}
                            />
                          </div>
                        )}
                        {q.type === "mcq" && (
                          <div className="space-y-2">
                            {(q.options || []).map((opt, i) => (
                              <label
                                key={i}
                                htmlFor={`apply-q-mcq-${id}-${i}`}
                                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all duration-150 ${
                                  value === opt ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                                }`}
                              >
                                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${value === opt ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                                  {value === opt && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </span>
                                <input
                                  type="radio"
                                  id={`apply-q-mcq-${id}-${i}`}
                                  name={id}
                                  checked={value === opt}
                                  onChange={() => setAnswer(id, opt)}
                                  className="sr-only"
                                />
                                <span className="text-sm text-slate-700">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {q.type === "checkbox" && (
                          <div className="space-y-2">
                            {(q.options || []).map((opt, i) => {
                              const arr = Array.isArray(value) ? value : [];
                              const checked = arr.includes(opt);
                              return (
                                <label
                                  key={i}
                                  htmlFor={`apply-q-cb-${id}-${i}`}
                                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all duration-150 ${
                                    checked ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                                  }`}
                                >
                                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${checked ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                                    {checked && <Check className="h-2.5 w-2.5 text-white" />}
                                  </span>
                                  <input
                                    type="checkbox"
                                    id={`apply-q-cb-${id}-${i}`}
                                    name={`apply-q-cb-${id}-${i}`}
                                    checked={checked}
                                    onChange={() => setAnswer(id, checked ? arr.filter((x) => x !== opt) : [...arr, opt])}
                                    className="sr-only"
                                  />
                                  <span className="text-sm text-slate-700">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                        {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
                      </div>
                    );
                  })}
                  <div className="mb-6">
                    <label htmlFor="apply-resume-url" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Paperclip className="h-4 w-4" /> Resume / CV Link (optional)
                    </label>
                    <input
                      id="apply-resume-url"
                      name="apply-resume-url"
                      type="url"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      placeholder="https://..."
                      className={INPUT_STYLE}
                    />
                    <p className="mt-1 text-xs text-slate-400">Google Drive, Dropbox, or any public link</p>
                  </div>
                  <div>
                    <label htmlFor="apply-portfolio-url" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <LinkIcon className="h-4 w-4" /> Portfolio URL (optional)
                    </label>
                    <input
                      id="apply-portfolio-url"
                      name="apply-portfolio-url"
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://..."
                      className={INPUT_STYLE}
                    />
                  </div>
                  {errors.submit && <p className="mt-4 text-sm text-red-600">{errors.submit}</p>}
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Review Your Application</h3>
                  <div className="mt-4 mb-6 rounded-xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-700">{clubName} â€” {drive?.roleTitle}</p>
                    <p className="mt-1 text-xs text-slate-500">Deadline: {formatDeadline(drive?.deadline)}</p>
                  </div>
                  {questions.map((q) => {
                    const id = q.questionId || q._id;
                    const val = answers[id];
                    const display = val === undefined || val === null ? "â€”" : Array.isArray(val) ? val.join(", ") : String(val);
                    if (!display || display === "â€”") return null;
                    return (
                      <div key={id} className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{q.label}</p>
                        <p className="text-sm text-slate-800">{display}</p>
                      </div>
                    );
                  })}
                  <button type="button" onClick={() => setStep(2)} className="float-right mb-4 text-sm font-medium text-blue-600 hover:underline">
                    Edit Answers
                  </button>
                  <div className="clear-both" />
                  <label htmlFor="apply-confirm-accurate" className="mt-6 flex cursor-pointer items-start gap-3">
                    <input
                      id="apply-confirm-accurate"
                      name="apply-confirm-accurate"
                      type="checkbox"
                      checked={confirmAccurate}
                      onChange={(e) => setConfirmAccurate(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">I confirm all information provided is accurate</span>
                  </label>
                  {errors.submit && <p className="mt-4 text-sm text-red-600">{errors.submit}</p>}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="mt-6 w-full rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white shadow-[0_1px_2px_rgba(37,99,235,0.3)] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</span> : "Submit Application"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {!success && (
          <div className="shrink-0 border-t border-[#F1F5F9] bg-white px-6 py-4">
            <div className="flex justify-between">
              <div>{step > 1 && <button type="button" onClick={handleBack} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">Back</button>}</div>
              <div>{step < 3 && <button type="button" onClick={handleNext} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(37,99,235,0.3)] hover:bg-blue-700">Continue â†’</button>}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
