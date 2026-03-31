import React from "react";
import { MessageSquareText, Star } from "lucide-react";

function RatingStars({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${value >= n ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
        />
      ))}
    </div>
  );
}

export default function EventFeedbackSummaryCard({
  title = "Feedback",
  summary,
  loading,
  compact = false,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-400">
        Loading feedback...
      </div>
    );
  }

  const average = Number(summary?.averageRating || 0);
  const count = Number(summary?.feedbackCount || 0);
  const items = Array.isArray(summary?.items) ? summary.items : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1e2d42] dark:bg-[#161f2e]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {count > 0 ? `${count} response${count !== 1 ? "s" : ""}` : "No feedback yet"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {count > 0 ? average.toFixed(1) : "—"}
          </p>
          <RatingStars value={Math.round(average)} />
        </div>
      </div>

      {!compact && items.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-[#1e2d42]">
          {items.slice(0, 3).map((item, index) => (
            <div key={item._id || index} className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-[#0f172a]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {item.user?.name || item.studentName || "Attendee"}
                  </span>
                </div>
                <RatingStars value={Number(item.rating || 0)} />
              </div>
              {item.comment && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
