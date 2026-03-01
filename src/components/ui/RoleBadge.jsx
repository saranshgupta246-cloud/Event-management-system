import React from "react";

const ROLE_COLORS = {
  President: "bg-blue-100 text-blue-700 border-blue-200",
  Secretary: "bg-green-100 text-green-700 border-green-200",
  Treasurer: "bg-purple-100 text-purple-700 border-purple-200",
  "Core Member": "bg-cyan-100 text-cyan-700 border-cyan-200",
  Volunteer: "bg-amber-100 text-amber-700 border-amber-200",
  Member: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function RoleBadge({ role }) {
  const r = role || "Member";
  const style = ROLE_COLORS[r] || ROLE_COLORS.Member;

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {r}
    </span>
  );
}
