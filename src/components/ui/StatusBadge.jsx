import React from "react";

const STATUS_STYLES = {
  pending: "bg-slate-100 text-slate-600",
  shortlisted: "bg-blue-100 text-blue-700",
  interview: "bg-amber-100 text-amber-800",
  selected: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-slate-100 text-slate-500",
};

export default function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const style = STATUS_STYLES[s] || STATUS_STYLES.pending;
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
