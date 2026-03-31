import React, { useMemo, useState } from "react";
import { MessageSquareText, Star, X } from "lucide-react";
import { saveEventFeedback } from "../../hooks/useEventFeedback";

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className="rounded-lg p-1 transition-transform hover:scale-105"
          aria-label={`Rate ${rating} star${rating > 1 ? "s" : ""}`}
        >
          <Star
            className={`h-7 w-7 ${
              value >= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function EventFeedbackModal({
  open,
  onClose,
  event,
  feedback,
  onSaved,
}) {
  const [rating, setRating] = useState(feedback?.rating || 0);
  const [comment, setComment] = useState(feedback?.comment || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const heading = useMemo(
    () => (feedback?._id ? "Edit Feedback" : "Give Feedback"),
    [feedback?._id]
  );

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await saveEventFeedback(event?._id, { rating, comment: comment.trim() }, feedback);
    setSaving(false);
    if (res?.success) {
      onSaved?.(res.data || { rating, comment: comment.trim() });
      onClose?.();
    } else {
      setError(res?.message || "Unable to save feedback.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1e2d42] dark:bg-[#161f2e]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-[#1e2d42]">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{heading}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {event?.title || "Selected event"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {error && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rating
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <MessageSquareText className="h-4 w-4" />
              Comment
            </label>
            <textarea
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share what went well or what could be improved..."
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#0f172a] dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-[#1e2d42] dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : feedback?._id ? "Update Feedback" : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
