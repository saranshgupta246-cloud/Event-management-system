import React from "react";

export default function LoadingSkeleton({ rows = 3, type = "table" }) {
  if (type === "card") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#1e2d42] dark:bg-[#161f2e]">
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d42]" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-[#161f2e]" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-[#161f2e]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-slate-100 py-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-[#1e2d42]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-[#1e2d42]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-[#161f2e]" />
          </div>
          <div className="h-4 w-16 shrink-0 animate-pulse rounded bg-slate-100 dark:bg-[#161f2e]" />
        </div>
      ))}
    </div>
  );
}
